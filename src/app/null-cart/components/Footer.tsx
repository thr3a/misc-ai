'use client';

import { Box, Container, Text } from '@mantine/core';

export const Footer = () => {
  return (
    <Box bg='#232F3E' py={24} mt='xl'>
      <Container size='xl'>
        <Text ta='center' c='#ccc' size='sm'>
          © 2026 null-cart. 架空のECサイトです。お金は一切かかりません。
        </Text>
      </Container>
    </Box>
  );
};
