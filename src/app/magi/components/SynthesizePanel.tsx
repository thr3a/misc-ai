import { Button, Group, List, Paper, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconDownload, IconUser } from '@tabler/icons-react';

type SynthesizeObject = {
  commonOpinions?: (string | undefined)[] | undefined;
  conflictingOpinions?: (string | undefined)[] | undefined;
  uniqueOpinions?: (string | undefined)[] | undefined;
};

type SynthesizePanelProps = {
  synthesizeObject: SynthesizeObject | undefined;
  isSynthesizing: boolean;
  synthesizeError: Error | null;
  onExport: () => void;
};

export const SynthesizePanel = ({
  synthesizeObject,
  isSynthesizing,
  synthesizeError,
  onExport
}: SynthesizePanelProps) => {
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
          <Button size='sm' variant='light' leftSection={<IconDownload size={16} />} onClick={onExport}>
            エクスポート
          </Button>
        </Group>
      )}
      {synthesizeObject && (
        <Stack gap='sm'>
          {synthesizeObject.commonOpinions && synthesizeObject.commonOpinions.length > 0 && (
            <Paper withBorder p='sm'>
              <Stack gap='xs'>
                <Title order={5} c='teal'>
                  共通している意見
                </Title>
                <List
                  spacing='xs'
                  icon={
                    <ThemeIcon color='teal' size={20} radius='xl'>
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  {synthesizeObject.commonOpinions.map((opinion, i) => (
                    <List.Item key={i}>
                      <Text size='sm'>{opinion}</Text>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            </Paper>
          )}
          {synthesizeObject.uniqueOpinions && synthesizeObject.uniqueOpinions.length > 0 && (
            <Paper withBorder p='sm'>
              <Stack gap='xs'>
                <Title order={5} c='violet'>
                  ユニークな意見
                </Title>
                <List
                  spacing='xs'
                  icon={
                    <ThemeIcon color='violet' size={20} radius='xl'>
                      <IconUser size={12} />
                    </ThemeIcon>
                  }
                >
                  {synthesizeObject.uniqueOpinions.map((opinion, i) => (
                    <List.Item key={i}>
                      <Text size='sm'>{opinion}</Text>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            </Paper>
          )}
          {synthesizeObject.conflictingOpinions && synthesizeObject.conflictingOpinions.length > 0 && (
            <Paper withBorder p='sm'>
              <Stack gap='xs'>
                <Title order={5} c='orange'>
                  対立している意見
                </Title>
                <List
                  spacing='xs'
                  icon={
                    <ThemeIcon color='orange' size={20} radius='xl'>
                      <IconAlertTriangle size={12} />
                    </ThemeIcon>
                  }
                >
                  {synthesizeObject.conflictingOpinions.map((opinion, i) => (
                    <List.Item key={i}>
                      <Text size='sm'>{opinion}</Text>
                    </List.Item>
                  ))}
                </List>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
};
