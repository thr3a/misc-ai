import { useObject } from '@ai-sdk/react';
import { Button, Group, List, Paper, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconDownload, IconUser } from '@tabler/icons-react';
import { type ReactNode, type RefObject, useCallback, useEffect, useMemo } from 'react';
import { OPINION_SECTIONS, type OpinionSectionKey, type ReconResult, synthesizeResultSchema } from '@/app/magi/type';
import { MODEL_DEFINITIONS, type ModelKey } from '@/app/magi/util';

type SynthesizePanelProps = {
  question: string;
  recon: ReconResult | null;
  completedResponses: Partial<Record<ModelKey, string>>;
  // 自動統合を一度だけ発火させるためのフラグ。リトライ時に親側で false に戻される
  autoSynthesizeTriggeredRef: RefObject<boolean>;
  onSynthesizeStart: () => void;
};

const SECTION_ICONS: Record<OpinionSectionKey, ReactNode> = {
  commonOpinions: <IconCheck size={12} />,
  uniqueOpinions: <IconUser size={12} />,
  conflictingOpinions: <IconAlertTriangle size={12} />
};

export const SynthesizePanel = ({
  question,
  recon,
  completedResponses,
  autoSynthesizeTriggeredRef,
  onSynthesizeStart
}: SynthesizePanelProps) => {
  const {
    object: synthesizeObject,
    submit: submitSynthesize,
    isLoading: isSynthesizing,
    error: synthesizeError
  } = useObject({
    api: '/api/magi/synthesize',
    schema: synthesizeResultSchema
  });

  const allModelsSucceeded = useMemo(
    () => MODEL_DEFINITIONS.every((d) => completedResponses[d.id] !== undefined),
    [completedResponses]
  );

  const handleSynthesize = useCallback(
    (responses: Partial<Record<ModelKey, string>>) => {
      onSynthesizeStart();
      const responseList = MODEL_DEFINITIONS.map((d) => responses[d.id] ?? '');
      submitSynthesize({ responses: responseList });
    },
    [onSynthesizeStart, submitSynthesize]
  );

  useEffect(() => {
    if (allModelsSucceeded && !autoSynthesizeTriggeredRef.current) {
      autoSynthesizeTriggeredRef.current = true;
      handleSynthesize(completedResponses);
    }
  }, [allModelsSucceeded, completedResponses, handleSynthesize, autoSynthesizeTriggeredRef]);

  const handleExport = () => {
    if (!synthesizeObject) return;

    const lines: string[] = [];

    lines.push(`# 質問\n\n${question}\n`);

    if (recon) {
      lines.push(`## 下調べ\n\n${recon.summary}\n`);
      if (recon.sources.length > 0) {
        lines.push('### 出典\n');
        for (const source of recon.sources) {
          lines.push(`- [${source.title}](${source.url})`);
        }
        lines.push('');
      }
    }

    lines.push('## 各モデルの回答\n');
    for (const definition of MODEL_DEFINITIONS) {
      const response = completedResponses[definition.id];
      if (response) {
        lines.push(`### ${definition.label}\n\n${response}\n`);
      }
    }

    lines.push('## 集合知の統合\n');

    for (const { key, label } of OPINION_SECTIONS) {
      const opinions = synthesizeObject[key];
      if (!opinions || opinions.length === 0) continue;
      lines.push(`### ${label}\n`, ...opinions.map((opinion) => `- ${opinion}`), '');
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'magi-result.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap='xs'>
      {synthesizeError && (
        <Text size='xs' c='red' ta='center'>
          {synthesizeError.message}
        </Text>
      )}
      {isSynthesizing && (
        <Stack gap='sm'>
          <Paper withBorder p='sm'>
            <Stack gap='xs'>
              <Skeleton height={20} width={150} />
              <Skeleton height={14} />
              <Skeleton height={14} width='80%' />
              <Skeleton height={14} width='65%' />
            </Stack>
          </Paper>
          <Paper withBorder p='sm'>
            <Stack gap='xs'>
              <Skeleton height={20} width={150} />
              <Skeleton height={14} />
              <Skeleton height={14} width='75%' />
            </Stack>
          </Paper>
        </Stack>
      )}
      {synthesizeObject && !isSynthesizing && (
        <Group justify='center'>
          <Button size='sm' variant='light' leftSection={<IconDownload size={16} />} onClick={handleExport}>
            エクスポート
          </Button>
        </Group>
      )}
      {synthesizeObject && (
        <Stack gap='sm'>
          {OPINION_SECTIONS.map(({ key, label, color }) => {
            const opinions = synthesizeObject[key];
            if (!opinions || opinions.length === 0) return null;
            return (
              <Paper withBorder p='sm' key={key}>
                <Stack gap='xs'>
                  <Title order={5} c={color}>
                    {label}
                  </Title>
                  <List
                    spacing='xs'
                    icon={
                      <ThemeIcon color={color} size={20} radius='xl'>
                        {SECTION_ICONS[key]}
                      </ThemeIcon>
                    }
                  >
                    {opinions.map((opinion, i) => (
                      <List.Item key={i}>
                        <Text size='sm'>{opinion}</Text>
                      </List.Item>
                    ))}
                  </List>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};
