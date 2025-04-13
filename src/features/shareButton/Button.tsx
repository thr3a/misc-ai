import { Button } from '@mantine/core';
import { IconBrandX } from '@tabler/icons-react';
import Link from 'next/link';
type Props = {
  url: string;
  description: string;
  label?: string;
};

export const TwitterButton = ({ url, description, label = 'ツイート!' }: Props) => {
  const encoded = encodeURI(`${description} ${url}`);
  const openURL = `https://twitter.com/intent/tweet?text=${encoded}`;
  return (
    <Button
      bg={'black'}
      leftSection={<IconBrandX size={14} />}
      component={Link}
      href={openURL}
      target='_blank'
      rel='noopener noreferrer'
    >
      {label}
    </Button>
  );
};
