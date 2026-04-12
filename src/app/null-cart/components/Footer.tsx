'use client';

import { Box, Container, Text } from '@mantine/core';

export const Footer = () => {
  return (
    <Box bg='#232F3E' py={24} mt='xl'>
      <Container size='xl'>
        <Text ta='center' c='#ccc' size='sm'>
          © 2026
          このサイトはユーザーの購入欲求を満たすために作られた架空のECサイトです。お金はかからないし物も届きません。
        </Text>
      </Container>
    </Box>
  );
};
