'use client';
import { createFormContext } from '@mantine/form';
import { type MessageProps } from '@/features/chat/ChatBox';
import { ChatBox } from '@/features/chat/ChatBox';
import { Box, Flex, Textarea, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getHotkeyHandler } from '@mantine/hooks';

type FormValues = {
  messages: MessageProps[]
  message: string
  loading: boolean
};

const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();

export default function Page (): JSX.Element {
  const form = useForm({
    initialValues: {
      messages: [],
      message: '',
      loading: false
    }
  });

  const handleSubmit = (): void => {
    if (form.values.message === '') return;
    if (form.values.loading) return;
    form.setFieldValue('loading', true);
    console.log(form.values);
    form.insertListItem('messages', { body: form.values.message, role: 'user' });
    form.insertListItem('messages', { body: 'form.values.message', role: 'bot' });
    form.setFieldValue('message', '');
    form.setFieldValue('loading', false);
  };

  return (
    <FormProvider form={form}>
      <Box maw={'400px'} style={{ border: '1px solid #eee' }} ml={0}>
        <ChatBox messages={form.getInputProps('messages').value} height='80vh'></ChatBox>
        <Flex>
          <Textarea
            placeholder="入力してください"
            autosize
            minRows={1}
            style={{ flexGrow: 1, display: 'block' }}
            {...form.getInputProps('message')}
            onKeyDown={getHotkeyHandler([
              ['mod+Enter', handleSubmit]
            ])}
          />
          <ActionIcon
            size={'lg'}
            variant={'outline'}
            color="blue"
            mt={'1px'}
            onClick={handleSubmit}
            loading={form.values.loading}
          >
            <IconSend></IconSend>
          </ActionIcon>
        </Flex>
      </Box>
    </FormProvider>
  );
}
