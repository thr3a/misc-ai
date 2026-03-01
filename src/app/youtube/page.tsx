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
  title: string;
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
      title: '',
      transcript: '',
      messageInputValue: '動画のタイトルの質問に対する解答を教えて下さい。',
      conversation: [
        { role: 'user', content: 'この動画の要点を教えてください。' },
        { role: 'assistant', content: 'この動画では主に3つのポイントが解説されています。\n\n1. **AIの基礎知識**: 機械学習とディープラーニングの違いについて詳しく説明されています。\n2. **実際の活用事例**: 医療・金融・製造業での具体的なAI活用例が紹介されています。\n3. **将来の展望**: 今後5〜10年でのAI技術の発展と社会への影響が予測されています。' },
        { role: 'user', content: '医療分野での活用事例をもう少し詳しく教えてください。' },
        { role: 'assistant', content: '医療分野でのAI活用について、動画では以下の事例が紹介されていました。\n\n- **画像診断の自動化**: X線やMRI画像からがんを高精度で検出するシステム\n- **創薬支援**: 新薬候補の分子構造をAIが予測し、開発期間を大幅に短縮\n- **電子カルテ解析**: 患者データから疾患リスクを事前に予測し、予防医療に活用\n\nこれらの技術により、医師の負担軽減と診断精度の向上が期待されています。' },
        { role: 'user', content: 'ありがとうございました！とてもわかりやすかったです。' },
        { role: 'assistant', content: 'お役に立てて嬉しいです！他にも気になる点があればお気軽にご質問ください。' },
      ],
      isResponding: false,
      isFetchingTranscript: false
    }
  });

  // 字幕取得
  const handleFetchTranscript = async () => {
    form.setFieldValue('isFetchingTranscript', true);
    try {
      const result = await fetchTranscript(form.values.youtubeUrl);
      if (result.status === 'ok') {
        form.setFieldValue('title', result.title);
        form.setFieldValue('transcript', result.transcribed);
      } else {
        form.setFieldValue('transcript', '字幕の取得に失敗しました');
      }
    } finally {
      form.setFieldValue('isFetchingTranscript', false);
    }
  };

  const handleSubmit = async (input: string): Promise<void> => {
    const updatedConversation: MessageProps[] = [...form.values.conversation, { role: 'user', content: input }];
    form.setValues({
      ...form.values,
      conversation: updatedConversation,
      isResponding: true
    });

    const { messages, newMessage } = await continueConversation(
      form.values.transcript,
      form.values.title,
      updatedConversation
    );

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
          <Button
            variant='light'
            onClick={() => handleButtonClick('動画の核となる内容を数値は省略せず箇条書きで10つで要約してください。')}
          >
            要約
          </Button>
          <Button variant='light' onClick={() => handleButtonClick('動画のタイトルの質問に対する解答を教えて下さい。')}>
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
