'use client';
import { SearchButton } from '@/app/ggr-en/components/SearchButton';
import { schema } from '@/app/ggr-en/type';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Box, Button, Group, Paper, Stack, Text, Textarea, Title } from '@mantine/core';
import { useState } from 'react';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default function Page() {
  const [query, setQuery] = useState('css remとpxの違い');
  const { object, submit, isLoading } = useObject({
    api: '/api/ggr-en',
    schema
  });

  const handleSubmit = () => {
    if (!query.trim()) return;
    submit({ query });
  };

  return (
    <Box>
      <Stack>
        <Textarea
          label='調べたい内容'
          placeholder='css remとpxの違い'
          rows={4}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Group justify='center'>
          <Button onClick={handleSubmit} loading={isLoading} disabled={!query}>
            翻訳!
          </Button>
        </Group>
        {object?.queries && object.queries.length > 0 && (
          <Paper p='md'>
            <Stack gap='sm'>
              {object.queries
                .filter((item): item is { query: string } => !!item?.query)
                .map((item, index) => (
                  <SearchButton key={`${item.query}-${index}`} keyword={item.query} />
                ))}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
