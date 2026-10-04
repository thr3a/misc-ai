import { ActionIcon, Avatar, Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCheck, IconCopy, IconDownload, IconRefresh, IconSparkles, IconTrash } from '@tabler/icons-react';
import type { ChatStatus, UIMessage } from 'ai';
import { Conversation, Message, PromptInput, Shimmer, Suggestion, Suggestions } from 'mantine-ai-elements';

const suggestions = ['今日の団活は何するの？', '宇宙人っていると思う？', '退屈なんだけど何か面白いことない？'];

const brandGradient = 'linear-gradient(135deg, var(--mantine-color-yellow-5), var(--mantine-color-orange-6))';

const collectText = (parts: UIMessage['parts']) =>
  parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && 'text' in part)
    .map((part) => part.text)
    .join('\n');

const HaruhiAvatar = ({ size }: { size: 'sm' | 'md' | 'xl' }) => (
  <Avatar
    size={size}
    variant='gradient'
    gradient={{ from: 'yellow.5', to: 'orange.6', deg: 135 }}
    fw='bold'
    style={{ flexShrink: 0 }}
  >
    ハ
  </Avatar>
);

export const ChatHeader = ({
  messages,
  status,
  onReset
}: {
  messages: UIMessage[];
  status: ChatStatus;
  onReset: () => void;
}) => {
  const isResponding = status === 'streaming' || status === 'submitted';
  return (
    <Group justify='space-between' wrap='nowrap' px='md' py='sm' c='white' style={{ background: brandGradient }}>
      <Group gap='sm' wrap='nowrap'>
        <Avatar size='md' color='orange' variant='white' fw='bold'>
          ハ
        </Avatar>
        <Box>
          <Text fw='bold' lh={1.3}>
            涼宮ハルヒ
          </Text>
          <Text size='xs' opacity={0.9}>
            {isResponding ? '入力中…' : 'SOS団 団長'}
          </Text>
        </Box>
      </Group>
      {messages.length > 0 && (
        <Group gap='xs' wrap='nowrap'>
          <Tooltip label='会話をダウンロード'>
            <Conversation.Download
              messages={messages}
              filename='sos-dan-chat.md'
              aria-label='会話をダウンロード'
              pos='static'
              variant='transparent'
              c='white'
              size='lg'
            >
              <IconDownload size={20} />
            </Conversation.Download>
          </Tooltip>
          <Tooltip label='会話をリセット'>
            <ActionIcon variant='transparent' c='white' size='lg' aria-label='会話をリセット' onClick={onReset}>
              <IconTrash size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}
    </Group>
  );
};

const CopyAction = ({ text }: { text: string }) => {
  const clipboard = useClipboard({ timeout: 1500 });
  return (
    <Message.Action
      color='gray'
      tooltip={clipboard.copied ? 'コピーしました' : 'コピー'}
      onClick={() => clipboard.copy(text)}
    >
      {clipboard.copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
    </Message.Action>
  );
};

const ChatMessage = ({
  message,
  isStreaming,
  isLast,
  onRegenerate
}: {
  message: UIMessage;
  isStreaming: boolean;
  isLast: boolean;
  onRegenerate: () => void;
}) => {
  const text = collectText(message.parts);

  if (message.role === 'user') {
    return (
      <Message
        from='user'
        maw='85%'
        styles={{ content: { background: brandGradient, padding: '0 var(--mantine-spacing-md)' } }}
      >
        <Message.Content>
          <Message.Response c='white'>{text}</Message.Response>
        </Message.Content>
      </Message>
    );
  }

  return (
    <Group align='flex-start' gap='xs' wrap='nowrap' maw='92%'>
      <HaruhiAvatar size='sm' />
      <Message
        from='assistant'
        maw='100%'
        styles={{
          // ユーザー側の吹き出し（ライブラリ既定の角丸）と見た目を揃えるため、同じ radius 変数を使う
          content: {
            background: 'var(--mantine-color-white)',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-md)',
            // 段落自体に上下マージンがあるため、上下 padding は 0 にして二重の余白を避ける
            padding: '0 var(--mantine-spacing-md)'
          }
        }}
      >
        <Message.Content>
          <Message.Response isAnimating={isStreaming}>{text}</Message.Response>
        </Message.Content>
        {!isStreaming && text !== '' && (
          <Message.Actions>
            <CopyAction text={text} />
            {isLast && (
              <Message.Action color='gray' tooltip='もう一度' onClick={onRegenerate}>
                <IconRefresh size={14} />
              </Message.Action>
            )}
          </Message.Actions>
        )}
      </Message>
    </Group>
  );
};

const EmptyState = ({ onSuggestion }: { onSuggestion: (text: string) => void }) => (
  <Stack align='center' justify='center' gap='md' py='xl' style={{ flex: 1 }}>
    <HaruhiAvatar size='xl' />
    <Stack align='center' gap={4}>
      <Group gap={6}>
        <IconSparkles size={18} color='var(--mantine-color-orange-6)' />
        <Text fw='bold' size='lg'>
          SOS団へようこそ！
        </Text>
      </Group>
      <Text size='sm' c='dimmed' ta='center'>
        ただの人間には興味ありません。話しかけてみなさい！
      </Text>
    </Stack>
    <Suggestions w='100%' rowProps={{ justify: 'center', wrap: 'wrap', w: '100%', px: 'xs' }}>
      {suggestions.map((suggestion) => (
        <Suggestion key={suggestion} suggestion={suggestion} color='orange' bg='white' onClick={onSuggestion} />
      ))}
    </Suggestions>
  </Stack>
);

export const Messages = ({
  messages,
  status,
  onRegenerate,
  onSuggestion
}: {
  messages: UIMessage[];
  status: ChatStatus;
  onRegenerate: () => void;
  onSuggestion: (text: string) => void;
}) => {
  const lastId = messages.at(-1)?.id;

  return (
    <Conversation
      aria-label='チャット履歴'
      bg='gray.0'
      styles={{
        viewport: { scrollbarGutter: 'auto' },
        content: { padding: 'var(--mantine-spacing-md) var(--mantine-spacing-sm)', gap: 'var(--mantine-spacing-lg)' }
      }}
    >
      <Conversation.Content>
        {messages.length === 0 && <EmptyState onSuggestion={onSuggestion} />}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={status === 'streaming' && message.id === lastId}
            isLast={message.id === lastId && status === 'ready'}
            onRegenerate={onRegenerate}
          />
        ))}
        {status === 'submitted' && (
          <Group gap='xs' wrap='nowrap'>
            <HaruhiAvatar size='sm' />
            <Shimmer role='status' fz='sm'>
              ハルヒが考え中…
            </Shimmer>
          </Group>
        )}
      </Conversation.Content>
      <Conversation.ScrollButton aria-label='最新のメッセージへ' />
    </Conversation>
  );
};

export const MessageInput = ({
  onSendMessage,
  onStop,
  status
}: {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  status: ChatStatus;
}) => {
  return (
    <Box p='sm' bg='white' style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
      {/* テキストのみ対応のため、貼り付け・ドロップによるファイル添付は maxFiles={0} で無効化する */}
      <PromptInput maxFiles={0} onSubmit={({ text }) => onSendMessage(text)}>
        {/* LINE 風に入力欄と送信ボタンを1行に並べ、入力欄が伸びても送信ボタンは下端に揃える */}
        <Group gap='xs' wrap='nowrap' align='flex-end'>
          <PromptInput.Body style={{ flex: 1 }}>
            <PromptInput.Textarea aria-label='メッセージ' placeholder='メッセージを入力' minRows={1} maxRows={5} />
          </PromptInput.Body>
          <PromptInput.Submit status={status} onStop={onStop} submitLabel='送信' stopLabel='停止' color='orange' />
        </Group>
      </PromptInput>
    </Box>
  );
};
