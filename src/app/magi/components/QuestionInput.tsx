import { Anchor, Button, Collapse, Group, List, Paper, Stack, Text, Textarea, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconSend2, IconSparkles } from '@tabler/icons-react';
import { ButtonCopy } from '@/app/html-ui/ButtonCopy';
import type { ReconResult } from '@/app/magi/type';

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
  errorMessage
}: QuestionInputProps) => {
  const isQuestionEmpty = question.length === 0;
  const [isReconOpened, { toggle: toggleRecon }] = useDisclosure(false);

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
      <Group justify='center' align='center'>
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
