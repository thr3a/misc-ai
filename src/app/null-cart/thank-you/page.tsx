'use client';

import { Box, Button, Container, Divider, Group, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure, useInterval, useTimeout } from '@mantine/hooks';
import { IconCheck, IconLock, IconShoppingCart } from '@tabler/icons-react';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';

type PaymentStep = {
  title: string;
  description: string;
};

const paymentSteps: PaymentStep[] = [
  {
    title: 'カード情報を安全に送信しています',
    description: '暗号化された接続で決済リクエストを送信しています。'
  },
  {
    title: 'ご利用状況を確認しています',
    description: 'カード決済の承認可否を照会しています。'
  },
  {
    title: '注文内容を確定しています',
    description: '承認完了後の購入データを反映しています。'
  }
];

const generateOrderId = () => `NULL-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;

const generateDeliveryDate = () => {
  return dayjs().locale('ja').year(2099).format('YYYY年M月D日');
};

const ThankYouPage = () => {
  const [isProcessing, { close: finishProcessing }] = useDisclosure(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [orderId] = useState(generateOrderId);
  const [deliveryDate] = useState(generateDeliveryDate);

  // isProcessing が false になった瞬間に紙吹雪を発火
  useEffect(() => {
    if (isProcessing) return;

    const fire = (origin: { x: number; y: number }, angle: number, count = 80) => {
      confetti({ particleCount: count, spread: 65, angle, origin, zIndex: 9999 });
    };

    // 中央から上へ
    fire({ x: 0.5, y: 0.7 }, 90, 100);

    // 左右から斜め上へ（少し遅らせて豪華に）
    const t1 = setTimeout(() => {
      fire({ x: 0, y: 0.6 }, 60);
      fire({ x: 1, y: 0.6 }, 120);
    }, 250);

    const t2 = setTimeout(() => {
      fire({ x: 0.2, y: 0.8 }, 75, 60);
      fire({ x: 0.8, y: 0.8 }, 105, 60);
    }, 550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      confetti.reset();
    };
  }, [isProcessing]);

  const stepInterval = useInterval(
    () => {
      setCurrentStepIndex((index) => {
        if (index >= paymentSteps.length - 1) {
          return index;
        }

        return index + 1;
      });
    },
    900,
    { autoInvoke: true }
  );

  useTimeout(
    () => {
      stepInterval.stop();
      finishProcessing();
    },
    10000,
    { autoInvoke: true }
  );

  if (isProcessing) {
    return (
      <Box bg='white' mih='100vh'>
        <Box bd='0 solid transparent' style={{ borderBottom: '1px solid #E3E6E6' }}>
          <Container size='sm' py='md'>
            <Group justify='space-between' gap='sm'>
              <Text ff='monospace' fw='bold' c='dark.8'>
                Secure Card Processing
              </Text>
              <Group gap={4}>
                <IconLock size={16} color='#495057' />
                <Text size='sm' c='gray.7'>
                  保護された接続
                </Text>
              </Group>
            </Group>
          </Container>
        </Box>

        <Container size='sm' py='xl'>
          <Box bd='1px solid #D5D9D9' bg='white' p='xl' style={{ boxShadow: '0 12px 32px rgba(15, 17, 17, 0.08)' }}>
            <Stack gap='xl'>
              <Stack gap='sm' align='center'>
                <Loader color='blue' size='xl' />
                <Stack gap={4} align='center'>
                  <Text size='xl' fw='bold' ta='center' c='dark.9'>
                    クレジットカード決済を処理しています
                  </Text>
                  <Text ta='center' c='gray.7'>
                    認証が完了するまで、このままお待ちください。
                  </Text>
                </Stack>
              </Stack>

              <Divider />

              <Stack gap='md'>
                {paymentSteps.map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  const textColor = isActive || isCompleted ? 'dark.9' : 'gray.6';
                  const markerColor = isCompleted ? 'green.7' : isActive ? 'dark.9' : 'gray.3';

                  return (
                    <Group key={step.title} align='flex-start' wrap='nowrap' gap='sm'>
                      <Box
                        mt={6}
                        w={12}
                        h={12}
                        miw={12}
                        bg={markerColor}
                        style={{ transition: 'background-color 160ms ease' }}
                      />
                      <Stack gap={2}>
                        <Text fw={isActive || isCompleted ? 'bold' : undefined} c={textColor}>
                          {step.title}
                        </Text>
                        <Text size='sm' c='gray.6'>
                          {step.description}
                        </Text>
                      </Stack>
                    </Group>
                  );
                })}
              </Stack>

              <Divider />

              <Text size='xs' ta='center' c='gray.6'>
                この画面は自動的に切り替わります。実際の決済や請求は発生しません。
              </Text>
            </Stack>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      style={{
        backgroundColor: '#EAEDED',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header />
      <Container size='md' py='xl' style={{ flex: 1 }}>
        <Box
          style={{
            backgroundColor: 'white',
            padding: 40,
            borderRadius: 4,
            textAlign: 'center'
          }}
        >
          {/* チェックアイコン */}
          <Box
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#007600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}
          >
            <IconCheck size={48} color='white' />
          </Box>

          <Text size='xl' fw='bold' c='#007600'>
            ご注文ありがとうございます！
          </Text>
          <Text c='#565959' mt='sm'>
            （架空の注文のため、実際の請求はございません）
          </Text>

          <Divider my='xl' />

          <Stack gap='md' ta='left'>
            <Group justify='space-between'>
              <Text fw='bold'>注文番号</Text>
              <Text c='#007185' ff='monospace'>
                {orderId}
              </Text>
            </Group>
            <Group justify='space-between'>
              <Text fw='bold'>お届け予定日</Text>
              <Text c='#007600' fw='bold'>
                {deliveryDate}
              </Text>
            </Group>
            <Group justify='space-between' align='flex-start'>
              <Text fw='bold'>お届け先</Text>
              <Text ta='right'>
                〒100-8111
                <br />
                東京都千代田区千代田1-1 皇居
              </Text>
            </Group>
          </Stack>

          <Divider my='xl' />

          <Text c='#565959' size='sm' mb='xl'>
            ご注文の確認メール（架空）をお送りしました。
            <br />
            実際にはメールは送信されません。これは架空のECサイトです。
          </Text>

          <Button
            component={Link}
            href='/null-cart'
            size='lg'
            leftSection={<IconShoppingCart size={20} />}
            style={{ backgroundColor: '#FFD814', color: '#0F1111' }}
          >
            ショッピングを続ける
          </Button>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
};

export default ThankYouPage;
