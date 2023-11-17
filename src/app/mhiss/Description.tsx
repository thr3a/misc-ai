'use client';

import { Paper, Text, Title } from '@mantine/core';

export const Description = (): JSX.Element => {
  return (
    <Paper>
      <Title order={2}>お母さんヒス構文とは?</Title>
      <Text>
          お母さんヒス構文とは、お母さんがヒステリックな口調で話を飛躍させたり、論点をすり替えたりして、相手に罪悪感を抱かせるような構文のことです。
      </Text>
      <Text>
        お笑い芸人のラランドさんがGERAのラジオ放送(第100回)で紹介したことが始まりです。
      </Text>
      <Text>
          お母さんヒス構文は感情を表現するために使われることがありますが、相手に対して威圧的な印象を与えることもあるので、注意が必要です。
          建設的なコミュニケーションを心がけましょう。
      </Text>
    </Paper>
  );
};
