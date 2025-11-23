'use client';

import { Badge, Box, Button, Divider, Group, Paper, Stack, Text, Textarea } from '@mantine/core';
import { useDisclosure, useInputState, useListState } from '@mantine/hooks';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

type DialogueRole = 'user' | 'assistant';
type ModelKey = 'gemini' | 'gpt5' | 'claude';
type ModelStatus = '待機中' | '生成中' | '応答済み';

type FollowUpMessage = {
  id: string;
  role: DialogueRole;
  content: string;
};

type ModelResponse = {
  id: ModelKey;
  label: string;
  status: ModelStatus;
  answer: string;
  chat: FollowUpMessage[];
  reviewer: ModelKey;
};

type FactCheckResult = {
  id: string;
  reviewerLabel: string;
  content: string;
};

const MODEL_RESPONSES: ModelResponse[] = [
  {
    id: 'gemini',
    label: 'Gemini',
    status: '応答済み',
    answer:
      'アニメ放映期と電子版キャンペーンの重なりで、今後2四半期は部数を維持。その後は海外TRPG人気と連動した伸びが見込めます。',
    chat: [
      {
        id: 'gemini-user-1',
        role: 'user',
        content: '若年層より社会人層の方が購買力高い？'
      },
      {
        id: 'gemini-assistant-1',
        role: 'assistant',
        content: '電子版は社会人層の決済が6割。ただし高校生の体験会参加率が伸びています。'
      }
    ],
    reviewer: 'gpt5'
  },
  {
    id: 'gpt5',
    label: 'GPT5',
    status: '生成中',
    answer: '予約率は伸びていますが、供給制約の影響で第4四半期に一度調整。アニメ2期発表が入れば再加速します。',
    chat: [
      {
        id: 'gpt5-user-1',
        role: 'user',
        content: '供給制約ってどのラインで発生？'
      },
      {
        id: 'gpt5-assistant-1',
        role: 'assistant',
        content: '印刷工程よりも配送リードタイムがボトルネックになっています。'
      }
    ],
    reviewer: 'claude'
  },
  {
    id: 'claude',
    label: 'Claude',
    status: '待機中',
    answer:
      'コミュニティ熱量は十分ですが、電子配信が遅れると熱が冷めるため、限定シナリオの先出しで維持する案を推奨します。',
    chat: [
      {
        id: 'claude-user-1',
        role: 'user',
        content: '限定シナリオってどの媒体が合う？'
      },
      {
        id: 'claude-assistant-1',
        role: 'assistant',
        content: '紙付録より、即日更新できる公式Discord配信の方が熱量を維持できます。'
      }
    ],
    reviewer: 'gemini'
  }
];

const FACT_CHECK_RESULTS: FactCheckResult[] = [
  {
    id: 'gemini-gpt5',
    reviewerLabel: 'GPT5 → Gemini',
    content:
      '出版社決算と一致。増刷計画も原典のまま引用されています。一次情報: KADOKAWA 3Q決算 / SNS分析ダッシュボード。数値の時間差を注記済み。'
  },
  {
    id: 'gpt5-claude',
    reviewerLabel: 'Claude → GPT5',
    content:
      '配送リードタイムのデータが2023年のまま。直近の遅延率が確認できていません。出版流通協会レポートの最新版リンクを追加してください。推計モデルは妥当です。'
  },
  {
    id: 'claude-gemini',
    reviewerLabel: 'Gemini → Claude',
    content:
      'Discordでの限定配信実績が複数社で確認でき、再現性もあります。過去のイベント売上データ（2024年8月）と矛盾なし。指標に定量値を添付すると説得力が増します。'
  }
];

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState('今後ルルブの人気はどうなると思う？');
  const [factCheckVisible, { toggle: toggleFactCheck }] = useDisclosure(false);
  const [followUpInputs, followUpHandlers] = useListState<string>(MODEL_RESPONSES.map(() => ''));

  const handleBroadcast = () => {
    setQuestion('');
  };

  const handleFollowUpChange = (index: number, value: string) => {
    followUpHandlers.setItem(index, value);
  };

  const handleFollowUpSend = (index: number) => {
    followUpHandlers.setItem(index, '');
  };

  return (
    <Box mx='auto' maw={480} px='xs' py='xs'>
      <Stack gap='lg'>
        <Paper withBorder p='md'>
          <Stack gap='sm'>
            <Textarea
              value={question}
              onChange={setQuestion}
              autosize
              minRows={3}
              maxRows={6}
              placeholder='例: 今後ルルブの人気はどうなると思う？'
            />
            <Group justify='space-between'>
              <Text size='xs' c='dimmed'>
                3モデルに一括送信して、それぞれの視点を待ちます。
              </Text>
              <Button size='sm' disabled={question.trim().length === 0} onClick={handleBroadcast}>
                一括リクエスト
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Stack gap='md'>
          {MODEL_RESPONSES.map((model, index) => (
            <Paper key={model.id} withBorder p='md'>
              <Stack gap='sm'>
                <Group justify='space-between' align='flex-start'>
                  <Stack gap={2}>
                    <Group gap='xs'>
                      <Text fw={600}>{model.label}</Text>
                      <Badge
                        variant='light'
                        color={model.status === '応答済み' ? 'teal' : model.status === '生成中' ? 'blue' : 'gray'}
                      >
                        {model.status}
                      </Badge>
                    </Group>
                  </Stack>
                </Group>

                <Text size='sm'>{model.answer}</Text>

                <Divider label='チャットログ' labelPosition='left' />
                <Stack gap='sm'>
                  {model.chat.map((message) => (
                    <Stack gap={2} key={message.id}>
                      <Text size='xs' c='dimmed'>
                        {message.role === 'user' ? '自分' : model.label}
                      </Text>
                      <Text size='sm'>{message.content}</Text>
                    </Stack>
                  ))}
                </Stack>

                <Stack gap='xs'>
                  <Textarea
                    autosize
                    minRows={1}
                    maxRows={4}
                    placeholder={`${model.label}に追撃の質問を書く`}
                    value={followUpInputs[index]}
                    onChange={(event) => handleFollowUpChange(index, event.currentTarget.value)}
                  />
                  <Group justify='flex-end'>
                    <Button
                      size='sm'
                      variant='light'
                      disabled={followUpInputs[index].trim().length === 0}
                      onClick={() => handleFollowUpSend(index)}
                    >
                      個別に送信
                    </Button>
                  </Group>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>

        <Paper withBorder p='md'>
          <Stack gap='sm'>
            <Group justify='space-between'>
              <Stack gap={2}>
                <Text size='sm' fw={600}>
                  ファクトチェック
                </Text>
                <Text size='xs' c='dimmed'>
                  Geminiの回答はGPT5が、GPT5はClaudeが、ClaudeはGeminiが検証します。
                </Text>
              </Stack>
              <Button size='sm' variant='outline' onClick={toggleFactCheck}>
                {factCheckVisible ? '結果を閉じる' : 'チェック実行'}
              </Button>
            </Group>

            {factCheckVisible ? (
              <Stack gap='sm'>
                {FACT_CHECK_RESULTS.map((result) => (
                  <Stack key={result.id} gap={4} p='sm' style={{ border: '1px solid var(--mantine-color-gray-3)' }}>
                    <Text size='sm' fw={500}>
                      {result.reviewerLabel}
                    </Text>
                    <Text size='sm'>{result.content}</Text>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Text size='xs' c='dimmed'>
                ボタンを押すと各AIがお互いの回答を検証し、正確性・妥当性のコメントを一覧表示します。
              </Text>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
