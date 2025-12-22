-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 用户与 AI 配置
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_providers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(50) NOT NULL, 
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'ollama'
    base_url VARCHAR(255),
    api_key VARCHAR(255),
    models JSONB DEFAULT '[]', -- 支持的模型列表
    is_active BOOLEAN DEFAULT true
);

-- ==========================================
-- 2. 书籍结构
-- ==========================================
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    cover_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ongoing',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    order_index INT NOT NULL
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volume_id UUID REFERENCES volumes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT, 
    content_state JSONB, 
    word_count INT DEFAULT 0,
    order_index INT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. 世界观实体 (人物/势力/道具)
-- ==========================================
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'character', 'location', 'faction', 'item'
    avatar_url VARCHAR(255),
    description TEXT,
    tags VARCHAR[], -- ['主角', '反派', '火系']
    attributes JSONB, -- { "境界": "金丹", "性别": "男" }
    is_archived BOOLEAN DEFAULT false
);

-- ==========================================
-- 4. 时空与纪元 (Time System) - 升级版
-- ==========================================
-- 纪元表：定义时间的大框架
CREATE TABLE eras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "黑暗纪元"
    order_index INT NOT NULL, -- 纪元的顺序 (1, 2, 3)
    start_absolute_tick BIGINT NOT NULL, -- 这个纪元在宇宙时间轴的起始点
    description TEXT
);

-- 事件表
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- 时间定位
    era_id UUID REFERENCES eras(id),
    year_in_era INT, -- 纪元内的第几年
    month_in_era INT,
    day_in_era INT,
    
    -- 核心排序字段 (程序自动计算: EraStart + Year*Scale)
    absolute_tick BIGINT NOT NULL, 
    
    -- 关联
    related_chapter_id UUID REFERENCES chapters(id)
);

-- 事件参与者 (记录谁参与了，什么角色)
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES timeline_events(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE, -- 关联到 entities 表
    role VARCHAR(50), -- 'initiator', 'target', 'observer'
    action_description TEXT, -- "发动了禁咒"
    UNIQUE(event_id, entity_id)
);

-- ==========================================
-- 5. 剧情线 (Story Arcs) - 新增
-- ==========================================
CREATE TABLE story_arcs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "复仇线"
    color VARCHAR(20), -- UI显示的颜色
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, abandoned
    description TEXT
);

-- 剧情线节点 (将事件或章节挂载到剧情线上)
CREATE TABLE arc_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arc_id UUID REFERENCES story_arcs(id) ON DELETE CASCADE,
    linked_event_id UUID REFERENCES timeline_events(id),
    linked_chapter_id UUID REFERENCES chapters(id),
    note TEXT, -- "埋下伏笔：玉佩是假的"
    order_index INT
);

-- ==========================================
-- 6. 动态关系网 (Dynamic Relations)
-- ==========================================
-- 基础连接
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id),
    entity_a_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    entity_b_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    UNIQUE(entity_a_id, entity_b_id)
);

-- 关系状态快照 (随事件变化)
CREATE TABLE relationship_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
    
    trigger_event_id UUID REFERENCES timeline_events(id), -- 由哪个事件触发改变
    start_tick BIGINT NOT NULL, -- 生效时间
    
    relation_type VARCHAR(50), -- 'enemy', 'ally'
    value INT, -- 亲密度数值
    label VARCHAR(100), -- "弑君之仇"
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
