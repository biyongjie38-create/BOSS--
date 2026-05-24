"use client";

import { FormEvent, useMemo, useState } from "react";

import type { AnalyzeResponse, ErrorCode } from "@/src/lib/types";

type ApiError = {
  code: ErrorCode;
  message: string;
};

type ApiErrorResponse = {
  error: ApiError;
};

const errorLabels: Record<ErrorCode, string> = {
  MISSING_SYMBOL: "输入错误",
  ALPHA_VANTAGE_ERROR: "行情获取失败",
  DEEPSEEK_ERROR: "AI 分析失败",
  INVALID_LLM_JSON: "AI JSON 无效",
  SUPABASE_SAVE_ERROR: "保存失败"
};

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const quoteRows = useMemo(() => extractQuoteRows(result?.quote), [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symbol })
      });

      const payload = (await response.json()) as AnalyzeResponse | ApiErrorResponse;
      if (isApiErrorResponse(payload)) {
        setError(payload.error);
        return;
      }

      if (!response.ok) {
        setError({
          code: "DEEPSEEK_ERROR",
          message: "Server returned an unexpected error response."
        });
        return;
      }

      setResult(payload);
    } catch {
      setError({
        code: "DEEPSEEK_ERROR",
        message: "Network request failed before the server returned a response."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Full-stack MVP</p>
            <h1>AI 股票分析面板</h1>
          </div>
          <span className={result?.saved ? "save-pill success" : "save-pill"}>
            {result?.saved ? "Supabase 已保存" : "等待分析"}
          </span>
        </header>

        <form className="query-panel" onSubmit={handleSubmit}>
          <label htmlFor="symbol">股票代码</label>
          <div className="input-row">
            <input
              id="symbol"
              name="symbol"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="AAPL"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "分析中..." : "开始分析"}
            </button>
          </div>
        </form>

        {error ? (
          <section className="notice error" aria-live="polite">
            <strong>{errorLabels[error.code]}</strong>
            <span>{error.code}</span>
            <p>{error.message}</p>
          </section>
        ) : null}

        <section className="result-grid">
          <article className="panel analysis-panel">
            <div className="panel-heading">
              <span>DeepSeek 分析</span>
              {result ? <strong>{result.symbol}</strong> : <strong>--</strong>}
            </div>
            {result ? (
              <>
                <p className="summary">{result.analysis.summary}</p>
                <div className="metric-row">
                  <Metric label="Sentiment" value={result.analysis.sentiment} />
                  <Metric label="Risk" value={result.analysis.risk_level} />
                </div>
              </>
            ) : (
              <p className="empty-state">提交股票代码后显示 summary、sentiment 和 risk_level。</p>
            )}
          </article>

          <article className="panel quote-panel">
            <div className="panel-heading">
              <span>Alpha Vantage 行情</span>
              <strong>{quoteRows.length ? `${quoteRows.length} 项` : "--"}</strong>
            </div>
            {quoteRows.length ? (
              <dl className="quote-list">
                {quoteRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="empty-state">行情返回后会在这里展示 Global Quote 摘要。</p>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isApiErrorResponse(payload: AnalyzeResponse | ApiErrorResponse): payload is ApiErrorResponse {
  return "error" in payload;
}

function extractQuoteRows(quote: AnalyzeResponse["quote"] | undefined): Array<[string, string]> {
  if (!quote) {
    return [];
  }

  const globalQuote = quote["Global Quote"];
  if (!globalQuote || typeof globalQuote !== "object") {
    return [];
  }

  return Object.entries(globalQuote)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => [key.replace(/^\d+\.\s*/, ""), value]);
}
