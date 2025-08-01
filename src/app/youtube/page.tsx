'use client';

import { readStreamableValue } from '@ai-sdk/rsc';
import { Box, Button, Group, TextInput, Textarea } from '@mantine/core';
import { createFormContext } from '@mantine/form';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { MessageInput, type MessageProps, Messages } from './Chat';
import { continueConversation, fetchTranscript } from './actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// フォーム値の型
type FormValues = {
  youtubeUrl: string;
  transcript: string;
  messageInputValue: string;
  conversation: MessageProps[];
  isResponding: boolean;
  isFetchingTranscript: boolean; // 字幕取得中フラグ
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Home() {
  const form = useForm({
    initialValues: {
      youtubeUrl: '',
      transcript: '',
      messageInputValue: '結論を述べてください',
      conversation: [],
      isResponding: false,
      isFetchingTranscript: false // 初期値
    }
  });

  // 字幕取得
  const handleFetchTranscript = async () => {
    form.setFieldValue('isFetchingTranscript', true); // 取得開始
    try {
      const result = await fetchTranscript(form.values.youtubeUrl);
      if (result.status === 'ok') {
        form.setFieldValue('transcript', result.title + result.transcribed);
      } else {
        form.setFieldValue('transcript', '字幕の取得に失敗しました');
      }
    } finally {
      form.setFieldValue('isFetchingTranscript', false); // 取得終了
    }
  };

  // メッセージ送信
  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [...form.values.conversation, { role: 'user', content: input }];
    form.setValues({
      ...form.values,
      conversation: updatedConversation,
      isResponding: true
    });

    const { messages, newMessage } = await continueConversation(form.values.transcript, updatedConversation);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      form.setFieldValue('conversation', [...messages, { role: 'assistant', content: textContent }]);
    }
    form.setFieldValue('isResponding', false);
  };

  const handleButtonClick = (text: string) => {
    form.setFieldValue('messageInputValue', text);
  };

  return (
    <FormProvider form={form}>
      <Box>
        <Suspense fallback={<div>Loading...</div>}>
          <SearchParamsComponent />
        </Suspense>
        <TextInput
          // w='100%'
          label='YoutubeのURLを入力して取得ボタンを押してください'
          placeholder='https://www.youtube.com/watch?v=xaY01JIAcCI'
          {...form.getInputProps('youtubeUrl')}
          inputContainer={(children) => (
            <Group align='flex-start' gap='0' w='100%'>
              <Box flex={1}>{children}</Box>
              <Button onClick={handleFetchTranscript} loading={form.values.isFetchingTranscript}>
                取得
              </Button>
            </Group>
          )}
        />
        <Textarea label='動画の字幕' readOnly minRows={5} mb={'md'} {...form.getInputProps('transcript')} />
        <MessageInput
          onSendMessage={handleSubmit}
          isResponding={form.values.isResponding}
          value={form.values.messageInputValue}
          onChange={(event) => form.setFieldValue('messageInputValue', event.currentTarget.value)}
        />
        <Group gap={'xs'}>
          <Button variant='light' onClick={() => handleButtonClick('３行の箇条書きで要約して')}>
            要約
          </Button>
          <Button variant='light' onClick={() => handleButtonClick('結論を述べてください')}>
            結論
          </Button>
        </Group>
        <Messages messages={form.values.conversation} />
      </Box>
    </FormProvider>
  );
}

function SearchParamsComponent() {
  const form = useFormContext();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = searchParams.get('url');
    if (url && form.values.youtubeUrl === '') {
      form.setFieldValue('youtubeUrl', url);
    }
  }, [searchParams, form]);

  return null;
}
