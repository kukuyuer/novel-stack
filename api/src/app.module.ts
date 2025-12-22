import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BooksModule } from './books/books.module';
import { ChaptersModule } from './chapters/chapters.module';
import { VolumesModule } from './volumes/volumes.module';
import { EntitiesModule } from './entities/entities.module';
import { UploadModule } from './upload/upload.module';
import { ErasModule } from './eras/eras.module';
import { TimelineModule } from './timeline/timeline.module';
import { RelationshipsModule } from './relationships/relationships.module';
import { AiModule } from './ai/ai.module';
import { ExportModule } from './export/export.module';
import { ImportModule } from './import/import.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [BooksModule, ChaptersModule, VolumesModule, EntitiesModule, UploadModule, ErasModule, TimelineModule, RelationshipsModule, AiModule, ExportModule, ImportModule, BackupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
