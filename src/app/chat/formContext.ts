import { createFormContext } from '@mantine/form';

export type MessageProps = {
  id: number;
  user: 'ai' | 'user';
  text: string;
};

export type FormValues = {
  messages: MessageProps[];
  newMessage: string;
  loading: boolean;
};

export const [FormProvider, useFormContext, useForm] = createFormContext<FormValues>();
