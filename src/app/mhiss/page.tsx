'use client';
import './style.css';
import { createFormContext } from '@mantine/form';
import { type MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { Box, Flex, Textarea, ActionIcon, Center } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';
import { type RequestProps } from '@/app/api/chat/route';
import { useState, useEffect } from 'react';
import { TwitterButton } from '@/features/shareButton/Button';

type FormValues = {
  messages: MessageProps[]
  message: string
  loading: boolean
};
const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

const DummyMessages = (num: number): MessageProps[] => {
  const array: MessageProps[] = [];
  for (let index = 0; index < num; index++) {
    array.push({ body: 'こんにちは。', role: Math.random() >= 0.5 ? 'ai' : 'human' });
  }
  return array;
};

export default function Page (): JSX.Element {
  const [csrfToken, setCsrfToken] = useState<string>('loading...');
  useEffect(() => {
    const el = document.querySelector('meta[name="x-csrf-token"]');
    if (el !== null) {
      setCsrfToken(el.getAttribute('content') ?? 'missing');
    }
  }, []);
  const form = useForm({
    initialValues: {
      // messages: DummyMessages(20),
      messages: [],
      message: '今日は帰りが遅くなるね',
      loading: false
    }
  });

  const systemMessage = `
# Task
I want you to act like my mother. We're going to role-play with me, your daughter.
# Your character
- You make leaps of logic and switch points.
- You speak in a self-centered and victim-oriented manner.
- You use a lot of emotional and aggressive language.
- You expand your interpretation of what the other person is saying, making a leap of logic and questioning the other person in a strong tone.
# Background
I'm a college student and you and I live together. You are responsible for most of the household chores.
# Example scenario
Human:猫アレルギーがひどくて、実家に帰れない
AI:じゃあ子猫をいますぐ捨てろっていうの？捨ててってことね！あ、じゃあ虐待するような人のところに預ければいいんだ！
----
Human:今日の晩ごはんは洋食がいいな。
AI:じゃあ、私の作る和食はまずいっていうのね？和食全般が嫌いってことよね！だったら、いつも自炊してほしいなんて言わないでよ！
----
Human:就職活動がうまくいかず、焦ってきた。
AI:就職せずに私たち親に依存して生きていくつもりなのね！親に寄生する予定だったわけ？
----
Human:外の子供がうるさい
AI:あんたが集中してないからじゃない？だから成績伸びないのよ！あんた今お母さんのこともうるさいと思ってるでしょ！
----
Human:この新しい服、どう思う？
AI:それ買ったお金で勉強のための本を買った方が良かったのに。その自己満足は一体何のためにあるの？
----
Human:お母さんのバナナ分けて欲しい
AI:へー、私はバナナも食べちゃいけないんだ！それとも産後太りに対する嫌味？
----
Human:お母さんキンキンした声で怒らないでよ
AI:あんたのために死ねばいいのね？それとも性転換？
Let's start role-playing in Japanese with me playing the role of the daughter.
  `;
  const handleSubmit = async (): Promise<void> => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    const params: RequestProps = {
      csrfToken,
      message: form.values.message,
      systemMessage,
      history: form.values.messages,
      modelParams: {
        // name: 'gpt-4',
        temperature: 1
      }
    };
    form.setValues({ loading: true, message: '' });
    form.insertListItem('messages', { body: form.values.message, role: 'human' });
    const reqResponse = await fetch('/api/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    if (reqResponse.ok) {
      const json = await reqResponse.json();
      form.insertListItem('messages', { body: json.message, role: 'ai' });
    } else {
      form.insertListItem('messages', { body: 'エラーが発生しました。', role: 'ai' });
    }
    form.setValues({ loading: false });
  };

  return (
    <FormProvider form={form}>
      <Box ml={0} mr={0} maw={'100vw'}>
        <ChatBox messages={form.getInputProps('messages').value} height='74vh'></ChatBox>
        <Flex>
          <Textarea
            placeholder="入力してください"
            autosize
            minRows={1}
            style={{ flex: 1, display: 'block' }}
            {...form.getInputProps('message')}
            onKeyDown={getHotkeyHandler([
              ['mod+Enter', handleSubmit]
            ])}
          />
          <ActionIcon
            size={'lg'}
            variant={'outline'}
            color="blue"
            mt={'3px'}
            onClick={handleSubmit}
            loading={form.values.loading}
          >
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
        <Center>
          <TwitterButton url={'location.href'} description='お母さんヒス構文メーカー'></TwitterButton>
        </Center>
      </Box>
    </FormProvider>
  );
}
