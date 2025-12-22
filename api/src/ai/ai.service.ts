import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // 1. 获取所有配置好的 AI 渠道
  async findAllProviders() {
    // 为了安全，不返回完整的 key，只返回部分信息
    const providers = await this.prisma.ai_providers.findMany({
      orderBy: { id: 'asc' }
    });
    return providers.map(p => ({
      ...p,
      api_key: p.api_key ? 'sk-****' + p.api_key.slice(-4) : '', // 掩码处理
    }));
  }

  // 2. 添加/更新 AI 渠道
  async saveProvider(data: any) {
    // 简单的单用户逻辑：暂时不做复杂的用户鉴权，默认 userId 先空着或者填个固定的
    // 这里的 data 应该包含 name, provider, baseUrl, apiKey, models
    
    // 也就是 CreateAiProviderDto，为了简便直接写逻辑
    return this.prisma.ai_providers.create({
      data: {
        name: data.name,
        provider: data.provider, // 'openai', 'deepseek', 'ollama'
        base_url: data.baseUrl,
        api_key: data.apiKey,
        models: data.models || [], // JSON 数组 ['gpt-4', 'deepseek-chat']
        is_active: true,
        // user_id: ... (多用户系统需要)
      }
    });
  }

  // 3. 删除渠道
  async deleteProvider(id: number) {
    // 注意 id 类型，根据 schema 可能是 int 或 uuid，之前 SQL 是 SERIAL (int)
    return this.prisma.ai_providers.delete({ where: { id: Number(id) } });
  }

  // 🔥 核心：调用 AI 生成文本
  async generateText(prompt: string, context: string, providerId: number) {
    // 1. 获取配置
    const providerConfig = await this.prisma.ai_providers.findUnique({
      where: { id: Number(providerId) }
    });

    if (!providerConfig) throw new BadRequestException('AI Channel not found');

    // 2. 初始化 OpenAI Client (兼容模式)
    const client = new OpenAI({
      apiKey: providerConfig.api_key || 'empty', // Ollama 不需要 key 但 SDK 需要非空
      baseURL: providerConfig.base_url || 'https://api.openai.com/v1',
    });

    // 3. 选择模型 (默认取列表第一个，或者前端传)
    // 这里的类型转换是个坑，prisma json 出来是 any
    const models = providerConfig.models as string[];
    const model = models && models.length > 0 ? models[0] : 'gpt-3.5-turbo';

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: '你是一个专业的小说写作助手。请根据用户的上下文续写或润色内容。只返回结果，不要啰嗦。' },
          { role: 'user', content: `上下文：\n${context}\n\n要求：${prompt}` }
        ],
        temperature: 0.8,
      });

      return { 
        result: response.choices[0]?.message?.content || '',
        model: model 
      };
    } catch (error) {
      console.error('AI Call Failed:', error);
      throw new BadRequestException(`AI调用失败: ${error.message}`);
    }
  }
}