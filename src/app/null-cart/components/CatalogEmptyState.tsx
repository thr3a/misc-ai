'use client';

import { Box, Button, Stack, Text } from '@mantine/core';
import Link from 'next/link';

type CatalogEmptyStateProps = {
  title: string;
  description: string;
};

export const CatalogEmptyState = ({ title, description }: CatalogEmptyStateProps) => {
  return (
    <Box bg='white' p='xl' ta='center'>
      <Stack gap='sm' align='center'>
        <Text size='xl' fw='bold'>
          {title}
        </Text>
        <Text c='dimmed'>{description}</Text>
        <Button component={Link} href='/null-cart/generate' style={{ backgroundColor: '#FFD814', color: '#0F1111' }}>
          AIで商品を生成する
        </Button>
      </Stack>
    </Box>
  );
};
