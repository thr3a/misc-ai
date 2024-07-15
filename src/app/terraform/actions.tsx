'use server';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { createStreamableValue } from 'ai/rsc';
import { schema } from './util';

export async function generate(input: string) {
  'use server';

  const stream = createStreamableValue();

  (async () => {
    const systemPrompt = `
あなたはインフラエンジニアエキスパートです。
入力された実現したいシステムのTerraformコードで実装に必要なすべてのTerraform resource nameを考えてください。
Terraform resource nameとなぜシステムにそのリソースが必要なのかの具体的な目的と概要を1セットとして箇条書きで出力してください。

## 例
### 実現したいシステム
東京リージョンにサーバーを1台構築したい
### 必要なTerraform resource name
- aws_vpc: サーバーが属するネットワークを提供するためにVPCを作成
- aws_subnet: サーバーをネットワークに属せるようにVPC内にサブネットを作成
- aws_internet_gateway: インターネットアクセスを提供のためにインターネットゲートウェイを作成
- aws_route_table: VPC内のルーティングを管理するためにルートテーブルを作成
- aws_route: インターネットゲートウェイへのルートを設定するためにルートを作成
- aws_route_table_association: サブネットとルートテーブルを関連付けるために使用
- aws_security_group: サーバーのインバウンドおよびアウトバウンドトラフィックを制御するためにセキュリティグループを作成
- aws_instance: EC2インスタンスを起動し、実際のサーバーを作成
`;
    const { partialObjectStream } = await streamObject({
      // model: openai('gpt-3.5-turbo'),
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: ['# 実現したいシステム', input, '#必要なTerraform resource name'].join('\n'),
      schema: schema,
      temperature: 0.2
    });

    for await (const partialObject of partialObjectStream) {
      stream.update(partialObject);
    }

    stream.done();
  })();

  return { object: stream.value };
}
