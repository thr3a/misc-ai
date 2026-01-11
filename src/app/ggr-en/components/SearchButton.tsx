import { Button } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';

export const SearchButton = ({ keyword }: { keyword: string }) => {
  return (
    <Button
      component='a'
      target='_blank'
      rel='noopener noreferrer'
      leftSection={<IconExternalLink size={14} />}
      href={`https://www.google.com/search?q=${keyword}`}
    >
      {keyword}
    </Button>
  );
};
