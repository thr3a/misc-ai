'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Carousel } from '@mantine/carousel';
import { Box, Stack } from '@mantine/core';
import { useInputState } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BroadcastPayload, ModelSlide } from '@/app/magi/components/ModelSlide';
import { QuestionInput } from '@/app/magi/components/QuestionInput';
import { SynthesizePanel } from '@/app/magi/components/SynthesizePanel';
import { synthesizeResultSchema } from '@/app/magi/type';
import { MODEL_DEFINITIONS, type ModelKey } from '@/app/magi/util';

// 関数名は変えないこと
export default function Page() {
  const [question, setQuestion] = useInputState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<BroadcastPayload>(null);
  const [completedResponses, setCompletedResponses] = useState<Partial<Record<ModelKey, string>>>({});
  const autoSynthesizeTriggered = useRef(false);

  const {
    object: synthesizeObject,
    submit: submitSynthesize,
    isLoading: isSynthesizing,
    error: synthesizeError
  } = useObject({
    api: '/api/magi/synthesize',
    schema: synthesizeResultSchema
  });

  const allModelsSucceeded = useMemo(
    () => MODEL_DEFINITIONS.every((d) => completedResponses[d.id] !== undefined),
    [completedResponses]
  );

  const handleSynthesize = useCallback(
    (responses: Partial<Record<ModelKey, string>>) => {
      setErrorMessage(null);
      const responseList = MODEL_DEFINITIONS.map((d) => responses[d.id] ?? '');
      submitSynthesize({ responses: responseList });
    },
    [submitSynthesize]
  );

  useEffect(() => {
    if (allModelsSucceeded && !autoSynthesizeTriggered.current) {
      autoSynthesizeTriggered.current = true;
      handleSynthesize(completedResponses);
    }
  }, [allModelsSucceeded, completedResponses, handleSynthesize]);

  const handleBroadcast = () => {
    setErrorMessage(null);
    setCompletedResponses({});
    setBroadcast((prev) => ({ text: question, id: (prev?.id ?? 0) + 1 }));
  };

  const handleEnhancePrompt = async () => {
    setErrorMessage(null);
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/magi/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question })
      });
      const payload = (await response.json().catch(() => null)) as { enhancedPrompt?: string; error?: string } | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error ?? '強化リクエストに失敗しました。');
      }
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

  const handleOnError = useCallback((_modelId: ModelKey) => {}, []);

  const handleOnRetry = useCallback((modelId: ModelKey) => {
    setCompletedResponses((prev) => {
      const next = { ...prev };
      delete next[modelId];
      return next;
    });
    autoSynthesizeTriggered.current = false;
  }, []);

  const handleExport = () => {
    if (!synthesizeObject) return;

    const lines: string[] = [];

    lines.push(`# 質問\n\n${question}\n`);

    lines.push('## 各モデルの回答\n');
    for (const definition of MODEL_DEFINITIONS) {
      const response = completedResponses[definition.id];
      if (response) {
        lines.push(`### ${definition.label}\n\n${response}\n`);
      }
    }

    lines.push('## 集合知の統合\n');

    if (synthesizeObject.commonOpinions && synthesizeObject.commonOpinions.length > 0) {
      lines.push('### 共通している意見\n');
      for (const opinion of synthesizeObject.commonOpinions) {
        lines.push(`- ${opinion}`);
      }
      lines.push('');
    }

    if (synthesizeObject.uniqueOpinions && synthesizeObject.uniqueOpinions.length > 0) {
      lines.push('### ユニークな意見\n');
      for (const opinion of synthesizeObject.uniqueOpinions) {
        lines.push(`- ${opinion}`);
      }
      lines.push('');
    }

    if (synthesizeObject.conflictingOpinions && synthesizeObject.conflictingOpinions.length > 0) {
      lines.push('### 対立している意見\n');
      for (const opinion of synthesizeObject.conflictingOpinions) {
        lines.push(`- ${opinion}`);
      }
      lines.push('');
    }

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'magi-result.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

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
          errorMessage={errorMessage}
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
              onCompleted={handleOnCompleted}
              onError={handleOnError}
              onRetry={handleOnRetry}
            />
          ))}
        </Carousel>

        <SynthesizePanel
          synthesizeObject={synthesizeObject}
          isSynthesizing={isSynthesizing}
          synthesizeError={synthesizeError ?? null}
          onExport={handleExport}
        />
      </Stack>
    </Box>
  );
}
