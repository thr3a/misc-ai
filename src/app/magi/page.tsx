'use client';

import { Carousel } from '@mantine/carousel';
import { Box, Stack } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { useCallback, useRef, useState } from 'react';
import { postJson } from '@/app/lib/postJson';
import { type BroadcastPayload, ModelSlide } from '@/app/magi/components/ModelSlide';
import { QuestionInput } from '@/app/magi/components/QuestionInput';
import { SynthesizePanel } from '@/app/magi/components/SynthesizePanel';
import {
  ACCEPTED_IMAGE_TYPES,
  COMPRESSED_MEDIA_TYPE,
  compressImage,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES
} from '@/app/magi/imageAttachment';
import { enhancePromptResultSchema, type ImageAttachment, type ReconResult, reconResultSchema } from '@/app/magi/type';
import { MODEL_DEFINITIONS, type ModelKey } from '@/app/magi/util';

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isReconning, setIsReconning] = useState(false);
  const [recon, setRecon] = useState<ReconResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<BroadcastPayload>(null);
  const [completedResponses, setCompletedResponses] = useState<Partial<Record<ModelKey, string>>>({});
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const autoSynthesizeTriggered = useRef(false);

  const handleBroadcast = () => {
    setErrorMessage(null);
    setCompletedResponses({});
    setBroadcast((prev) => ({ text: question, images, id: (prev?.id ?? 0) + 1 }));
  };

  const handleImagesAdd = async (files: FileList) => {
    setErrorMessage(null);
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`画像は最大${MAX_IMAGES}枚までです。`);
      return;
    }
    const newImages: ImageAttachment[] = [];
    for (const file of Array.from(files).slice(0, remainingSlots)) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setErrorMessage('対応していない画像形式です。jpeg・png・webpのみ利用できます。');
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setErrorMessage('画像サイズは1枚あたり5MBまでです。');
        continue;
      }
      try {
        const dataUrl = await compressImage(file);
        newImages.push({ id: crypto.randomUUID(), dataUrl, mediaType: COMPRESSED_MEDIA_TYPE });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
      }
    }
    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleImageRemove = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleRecon = async () => {
    setErrorMessage(null);
    setIsReconning(true);
    try {
      const payload = await postJson(
        '/api/magi/recon',
        { prompt: question },
        reconResultSchema,
        '下調べリクエストに失敗しました。'
      );
      setRecon(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsReconning(false);
    }
  };

  const handleEnhancePrompt = async () => {
    setErrorMessage(null);
    setIsEnhancing(true);
    try {
      const payload = await postJson(
        '/api/magi/enhance-prompt',
        { prompt: question },
        enhancePromptResultSchema,
        '強化リクエストに失敗しました。'
      );
      if (payload.enhancedPrompt) {
        setQuestion(payload.enhancedPrompt);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleOnCompleted = useCallback((modelId: ModelKey, response: string) => {
    setCompletedResponses((prev) => ({ ...prev, [modelId]: response }));
  }, []);

  const handleOnRetry = useCallback((modelId: ModelKey) => {
    setCompletedResponses((prev) => {
      const next = { ...prev };
      delete next[modelId];
      return next;
    });
    autoSynthesizeTriggered.current = false;
  }, []);

  const handleSynthesizeStart = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return (
    <Box mx='auto' mb={'xl'}>
      <Stack gap='md'>
        <QuestionInput
          question={question}
          onQuestionChange={(value) => {
            setErrorMessage(null);
            setQuestion(value);
          }}
          onBroadcast={handleBroadcast}
          onEnhance={handleEnhancePrompt}
          isEnhancing={isEnhancing}
          onRecon={handleRecon}
          isReconning={isReconning}
          recon={recon}
          onReconClear={() => setRecon(null)}
          errorMessage={errorMessage}
          images={images}
          onImagesAdd={handleImagesAdd}
          onImageRemove={handleImageRemove}
        />

        <Carousel
          slideGap='md'
          slideSize={{ base: '100%', sm: '50%', lg: '33.333333%' }}
          withIndicators
          withControls={false}
          emblaOptions={{ align: 'start', loop: false }}
          styles={{
            indicator: {
              backgroundColor: 'var(--mantine-color-blue-2)',
              border: '1px solid var(--mantine-color-blue-4)',
              height: '12px',
              '&[dataActive]': {
                backgroundColor: 'var(--mantine-color-blue-8)',
                borderColor: 'var(--mantine-color-blue-9)'
              }
            }
          }}
        >
          {MODEL_DEFINITIONS.map((definition) => (
            <ModelSlide
              key={definition.id}
              definition={definition}
              broadcast={broadcast}
              recon={recon?.summary}
              onCompleted={handleOnCompleted}
              onRetry={handleOnRetry}
            />
          ))}
        </Carousel>

        <SynthesizePanel
          question={question}
          recon={recon}
          completedResponses={completedResponses}
          autoSynthesizeTriggeredRef={autoSynthesizeTriggered}
          onSynthesizeStart={handleSynthesizeStart}
        />
      </Stack>
    </Box>
  );
}
