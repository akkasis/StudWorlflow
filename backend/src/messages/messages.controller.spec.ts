import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ModerationService } from '../moderation/moderation.service';

describe('MessagesController', () => {
  let controller: MessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ModerationService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
