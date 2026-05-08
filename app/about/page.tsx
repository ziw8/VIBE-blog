import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal";
import { SiteLink } from "@/components/site-link";

export const metadata: Metadata = {
  title: "About",
  description: "이 블로그에 대한 간단한 소개입니다.",
};

export default function AboutPage() {
  return (
    <Container>
      <div className="space-y-10">
        <Reveal>
          <h1 className="font-semibold text-black dark:text-white">About</h1>
        </Reveal>

        <Reveal delay={120}>
          <article className="article space-y-4">
            <p>
              이 블로그는 소프트웨어, 디자인, 그리고 디지털 작업을 조금 더
              낫게 만드는 작은 선택들을 기록하는 공간입니다.
            </p>
            <p>
              화면의 기본 구조는{" "}
              <SiteLink href="https://github.com/markhorn-dev/astro-nano">
                Astro Nano
              </SiteLink>
              의 미니멀한 리듬을 참고해 블로그에 맞게 적용했습니다.
            </p>
            <p>
              과한 장식보다 읽기 편한 간격과 목록 중심의 흐름을 우선합니다.
            </p>
          </article>
        </Reveal>
      </div>
    </Container>
  );
}
