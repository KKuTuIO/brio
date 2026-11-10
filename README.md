# brio

미디어위키의 속도를 개선하고 사소한 내비게이션 개선을 적용한 SvelteKit 기반 프론트엔드입니다.

활력을 뜻하는 영단어 **Brio**처럼 미디어위키 기반 위키위키에 활력을 더해보세요.

Brio는 끄투리오 개발팀에서 ❤️을 담아 제작합니다.

## 주요 특징

- [the seed 엔진](https://theseed.io)의 일부 기능을 포팅했습니다.
  - 리다이렉트 공지
  - 각주 팝오버 / 모달 표출
  - 접을 수 있는 목차
  - 우측 하단 목차 내비게이션
- Monaco 기반으로 신텍스 하이라이팅을 지원하는 미디어위키 에디터를 탑재했습니다.
- [Liberty 스킨](https://github.com/librewiki/liberty-skin) 및 미디어위키의 설정값을 그대로 활용할 수 있습니다.
- 프론트엔드를 최신 프레임워크로 작업하고 PHP 기반 서버로부터 API만 받기 때문에 체감 속도가 상당히 빨라집니다.

## 설치 요건

- Node.js / pnpm
- Action API 사용 가능한 미디어위키 (>= v1.4.3)

## 시작하기

```sh
pnpm install
cp .env.example .env
pnpm dev
```

## 환경변수 일람

| 키              | 비고                                            |
| --------------- | ----------------------------------------------- |
| `MW_ORIGIN`     | 백엔드로 활용할 미디어위키 URI                  |
| `SITE_ORIGIN`   | 외부에 공개될 프론트엔드 URI                    |
| `NAVBAR_PAGE`   | 내비게이션 바 출처 (기본값: `MediaWiki:Navbar`) |
| `MAIN_PAGE`     | 대문 경로 수정                                  |
| `RC_NAMESPACES` | '최근 수정'에 표출할 문서 수 (default `0        | 4   | 10  | 12  | 14`) |
| `NOINDEX`       | 검색 엔진 검색 차단 (기본값: `0`)               |

## 라이선스

brio는 GPL-3.0-or-later 라이선스로 배포됩니다. 라이선스 전문은 `LICENSE`에서 확인할 수 있으며, 내부 컴포넌트 중 특수한 라이선스가 적용되는 경우 `OPENSOURCE_LICENSE.md`에 작성했습니다.
