import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Collapse,
  Group,
  Image,
  List,
  Paper,
  Stack,
  Text,
  Textarea,
  Tooltip
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPhotoPlus, IconSearch, IconSend2, IconSparkles, IconX } from '@tabler/icons-react';
import { useRef } from 'react';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import { MAX_IMAGES } from '@/app/magi/imageAttachment';
import type { ImageAttachment, ReconResult } from '@/app/magi/type';

type QuestionInputProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  onBroadcast: () => void;
  onEnhance: () => void;
  isEnhancing: boolean;
  onRecon: () => void;
  isReconning: boolean;
  recon: ReconResult | null;
  onReconClear: () => void;
  errorMessage: string | null;
  images: ImageAttachment[];
  onImagesAdd: (files: FileList) => void;
  onImageRemove: (id: string) => void;
};

export const QuestionInput = ({
  question,
  onQuestionChange,
  onBroadcast,
  onEnhance,
  isEnhancing,
  onRecon,
  isReconning,
  recon,
  onReconClear,
  errorMessage,
  images,
  onImagesAdd,
  onImageRemove
}: QuestionInputProps) => {
  const isQuestionEmpty = question.length === 0;
  const [isReconOpened, { toggle: toggleRecon }] = useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack gap='xs'>
      <Textarea
        label={'質問内容'}
        value={question}
        onChange={(e) => onQuestionChange(e.currentTarget.value)}
        autosize
        minRows={5}
        maxRows={10}
        placeholder='スプラトゥーンが流行った理由は？'
      />

      {images.length > 0 && (
        <Group gap='xs'>
          {images.map((image) => (
            <Box key={image.id} pos='relative'>
              <Image src={image.dataUrl} alt='添付画像' w={64} h={64} fit='cover' />
              <ActionIcon
                size='xs'
                color='red'
                variant='filled'
                style={{ position: 'absolute', top: -6, right: -6 }}
                onClick={() => onImageRemove(image.id)}
              >
                <IconX size={12} />
              </ActionIcon>
            </Box>
          ))}
        </Group>
      )}

      <Group justify='center' align='center'>
        <Tooltip label={`画像を追加（最大${MAX_IMAGES}枚）`}>
          <Button
            size='sm'
            variant='light'
            color='gray'
            disabled={images.length >= MAX_IMAGES}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconPhotoPlus size={20} stroke={1.5} />
          </Button>
        </Tooltip>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/jpeg,image/png,image/webp'
          multiple
          hidden
          onChange={(e) => {
            if (e.currentTarget.files && e.currentTarget.files.length > 0) {
              onImagesAdd(e.currentTarget.files);
            }
            e.currentTarget.value = '';
          }}
        />
        <Tooltip label='送信'>
          <Button size='sm' disabled={isQuestionEmpty} onClick={onBroadcast}>
            <IconSend2 size={20} stroke={1.5} />
          </Button>
        </Tooltip>
        <Tooltip label='強化'>
          <Button size='sm' variant='light' loading={isEnhancing} disabled={isQuestionEmpty} onClick={onEnhance}>
            <IconSparkles size={20} stroke={1.5} />
          </Button>
        </Tooltip>
        <Tooltip label='下調べ'>
          <Button
            size='sm'
            variant='light'
            color='teal'
            loading={isReconning}
            disabled={isQuestionEmpty}
            onClick={onRecon}
          >
            <IconSearch size={20} stroke={1.5} />
          </Button>
        </Tooltip>
        <ButtonCopy content={question} disabled={isQuestionEmpty} />
      </Group>

      {recon && (
        <Paper withBorder p='sm'>
          <Stack gap='xs'>
            <Group justify='space-between' align='center'>
              <Text size='sm' fw='bold'>
                調査レポート
              </Text>
              <Group gap='xs'>
                <Button size='compact-xs' variant='subtle' onClick={toggleRecon}>
                  {isReconOpened ? '閉じる' : '内容を見る'}
                </Button>
                <Button size='compact-xs' variant='subtle' color='red' onClick={onReconClear}>
                  破棄
                </Button>
              </Group>
            </Group>
            <Collapse in={isReconOpened}>
              <Stack gap='xs'>
                <Text size='sm' style={{ whiteSpace: 'pre-wrap' }}>
                  {recon.summary}
                </Text>
                {recon.sources.length > 0 && (
                  <List size='xs' spacing='xs'>
                    {recon.sources.map((source) => (
                      <List.Item key={source.url}>
                        <Anchor href={source.url} target='_blank' rel='noreferrer' size='xs'>
                          {source.title}
                        </Anchor>
                      </List.Item>
                    ))}
                  </List>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Paper>
      )}

      {errorMessage && (
        <Text size='xs' c='red' ta='center'>
          {errorMessage}
        </Text>
      )}
    </Stack>
  );
};
