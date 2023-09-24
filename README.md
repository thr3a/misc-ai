# 利用方法

```
npx create-next-app hogehoge --use-npm --example https://github.com/thr3a/nextjs-template
```

# ひな壇生成

```
npm run plop form my-xxx
```

# アップデート

```
npx npm-check-updates -u
```

# ts直接実行する

```
node --loader ts-node/esm src/scripts/sample.ts
```

# デプロイ

## GitHub Pages (https://thr3a.github.io/<レポジトリ名>の場合)

next.config.mjsより

```ts
const nextConfig = {
  basePath: process.env.GITHUB_ACTIONS && '/レポジトリ名',
  trailingSlash: true,
  // assetPrefix: '/レポジトリ名',
};
```

## GitHub Pages (独自ドメインの場合)

.github/workflows/build.ymlより「cname」をコメントアウト外す

## Kubernetes

- .github/workflows/build.ymlを修正
- next.config.mjsのoutputを「standalone」にする

# TODO

- データベース
