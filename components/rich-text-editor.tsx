"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";

type RichTextEditorProps = {
  ariaLabel: string;
  enableEmbeds?: boolean;
  initialHtml?: string;
  minHeightClassName?: string;
  onChange?: (html: string) => void;
};

export type RichTextEditorHandle = {
  clear: () => void;
  focus: () => void;
  getHtml: () => string;
  setHtml: (html: string) => void;
};

const colorOptions = [
  { label: "검정", swatch: "var(--article-default-text)", value: "default" },
  { label: "회색", swatch: "var(--article-muted-text)", value: "muted" },
] as const;

const alignmentOptions = [
  ["justifyLeft", "왼쪽 정렬", "L"],
  ["justifyCenter", "가운데 정렬", "C"],
  ["justifyRight", "오른쪽 정렬", "R"],
  ["justifyFull", "양쪽 정렬", "J"],
] as const;
const codeLanguageOptions = [
  { label: "Text", value: "text" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "TSX", value: "tsx" },
  { label: "JSON", value: "json" },
  { label: "Bash", value: "bash" },
  { label: "Python", value: "python" },
  { label: "SQL", value: "sql" },
] as const;

type UploadResponse = {
  message?: string;
  url?: string;
};

function getSelectionRange() {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  return selection.getRangeAt(0);
}

function normalizeLinkUrl(value: string | null) {
  const trimmedUrl = value?.trim();

  if (!trimmedUrl || /^javascript:/i.test(trimmedUrl)) {
    return null;
  }

  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

function preventToolbarBlur(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getSelectedText() {
  const selection = window.getSelection();

  return selection?.toString() ?? "";
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  {
    ariaLabel,
    enableEmbeds = false,
    initialHtml = "",
    minHeightClassName = "min-h-72",
    onChange,
  },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const savedRangeRef = useRef<Range | null>(null);
  const [codeLanguage, setCodeLanguage] =
    useState<(typeof codeLanguageOptions)[number]["value"]>("text");
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
      onChange?.(initialHtml);
    }
  }, [initialHtml, onChange]);

  function saveRange() {
    const range = getSelectionRange();

    if (!range || !editorRef.current) {
      return;
    }

    if (editorRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range;
    }
  }

  function restoreRange() {
    const range = savedRangeRef.current;
    const selection = window.getSelection();

    if (!range || !selection) {
      editorRef.current?.focus();
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }

  function syncHtml() {
    const html = editorRef.current?.innerHTML ?? "";
    onChange?.(html);
    saveRange();
  }

  const setHtml = useCallback((html: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }

    savedRangeRef.current = null;
    onChange?.(html);
  }, [onChange]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => setHtml(""),
      focus: () => editorRef.current?.focus(),
      getHtml: () => editorRef.current?.innerHTML ?? "",
      setHtml,
    }),
    [setHtml],
  );

  function runCommand(command: string, value?: string) {
    restoreRange();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncHtml();
  }

  function insertHtml(html: string) {
    restoreRange();

    const selection = window.getSelection();
    const editor = editorRef.current;

    if (!selection || selection.rangeCount === 0 || !editor) {
      editor?.focus();
      document.execCommand("insertHTML", false, html);
      syncHtml();
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const template = document.createElement("template");
    template.innerHTML = html;
    const fragment = template.content;
    const lastNode = fragment.lastChild;

    range.insertNode(fragment);

    if (lastNode) {
      const nextRange = document.createRange();
      nextRange.setStartAfter(lastNode);
      nextRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(nextRange);
      savedRangeRef.current = nextRange;
    }

    editor.focus();
    syncHtml();
  }

  async function uploadFile(file: File, kind: "image" | "video") {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => ({}))) as UploadResponse;

    if (!response.ok || !result.url) {
      throw new Error(result.message ?? "파일을 업로드하지 못했습니다.");
    }

    return result.url;
  }

  function createImageGalleryHtml(urls: string[]) {
    const images = urls
      .map(
        (url) =>
          `<img src="${url}" alt="" loading="lazy" decoding="async" />`,
      )
      .join("");

    return `<figure class="post-media-gallery" data-gallery-count="${urls.length}" contenteditable="false">${images}</figure><p><br></p>`;
  }

  function createVideoHtml(url: string) {
    return `<figure class="post-video" contenteditable="false"><video src="${url}" controls playsinline preload="metadata"></video></figure><p><br></p>`;
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    if ((event.target.files?.length ?? 0) > 4) {
      setUploadMessage("사진은 한 번에 최대 4개까지 추가할 수 있습니다.");
    } else {
      setUploadMessage(null);
    }

    setIsUploading(true);

    try {
      const urls = await Promise.all(
        files.map((file) => uploadFile(file, "image")),
      );
      insertHtml(createImageGalleryHtml(urls));
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "사진을 추가하지 못했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const url = await uploadFile(file, "video");
      insertHtml(createVideoHtml(url));
    } catch (error) {
      setUploadMessage(
        error instanceof Error ? error.message : "동영상을 추가하지 못했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function insertCodeBlock() {
    const selectedText = getSelectedText();
    const code = selectedText || "코드를 입력해주세요.";

    insertHtml(
      `<pre data-code-language="${codeLanguage}"><code class="language-${codeLanguage}">${escapeHtml(code)}</code></pre><p><br></p>`,
    );
  }

  function applyTextColor(value: (typeof colorOptions)[number]["value"]) {
    restoreRange();

    const selection = window.getSelection();
    const editor = editorRef.current;

    if (!selection || selection.rangeCount === 0 || !editor) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const span = document.createElement("span");
    span.dataset.postColor = value;

    span.appendChild(range.extractContents());
    range.insertNode(span);

    const nextRange = document.createRange();
    nextRange.setStartAfter(span);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange;
    editor.focus();
    syncHtml();
  }

  function applyLink() {
    saveRange();
    const href = normalizeLinkUrl(
      window.prompt("링크 주소를 입력해주세요.", "https://"),
    );

    if (!href) {
      return;
    }

    restoreRange();

    const selection = window.getSelection();
    const editor = editorRef.current;

    if (!selection || selection.rangeCount === 0 || !editor) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (range.collapsed || !editor.contains(range.commonAncestorContainer)) {
      editor.focus();
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.appendChild(range.extractContents());
    range.insertNode(link);

    const nextRange = document.createRange();
    nextRange.setStartAfter(link);
    nextRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange;
    editor.focus();
    syncHtml();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border-y border-black/10 py-3 dark:border-white/15">
        <button
          type="button"
          title="굵게"
          aria-label="굵게"
          className="grid size-8 place-items-center rounded-md border border-black/10 font-bold text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
          onMouseDown={preventToolbarBlur}
          onClick={() => runCommand("bold")}
        >
          B
        </button>
        <button
          type="button"
          title="기울임"
          aria-label="기울임"
          className="grid size-8 place-items-center rounded-md border border-black/10 italic text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
          onMouseDown={preventToolbarBlur}
          onClick={() => runCommand("italic")}
        >
          I
        </button>
        <button
          type="button"
          title="밑줄"
          aria-label="밑줄"
          className="grid size-8 place-items-center rounded-md border border-black/10 text-black underline transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
          onMouseDown={preventToolbarBlur}
          onClick={() => runCommand("underline")}
        >
          U
        </button>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

        {colorOptions.map((color) => (
          <button
            key={color.value}
            type="button"
            title={color.label}
            aria-label={color.label}
            className="grid size-8 place-items-center rounded-md border border-black/10 transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:hover:border-white/35"
            onMouseDown={preventToolbarBlur}
            onClick={() => applyTextColor(color.value)}
          >
            <span
              aria-hidden="true"
              className="size-3 rounded-full"
              style={{ backgroundColor: color.swatch }}
            />
          </button>
        ))}

        <button
          type="button"
          className="h-8 rounded-md border border-black/10 px-2 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
          onMouseDown={preventToolbarBlur}
          onClick={applyLink}
        >
          Link
        </button>

        <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

        {alignmentOptions.map(([command, label, text]) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            className="grid size-8 place-items-center rounded-md border border-black/10 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
            onMouseDown={preventToolbarBlur}
            onClick={() => runCommand(command)}
          >
            {text}
          </button>
        ))}

        {enableEmbeds ? (
          <>
            <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <button
              type="button"
              className="h-8 rounded-md border border-black/10 px-2 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white dark:hover:border-white/35"
              disabled={isUploading}
              onMouseDown={preventToolbarBlur}
              onClick={() => imageInputRef.current?.click()}
            >
              Image
            </button>
            <button
              type="button"
              className="h-8 rounded-md border border-black/10 px-2 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-white dark:hover:border-white/35"
              disabled={isUploading}
              onMouseDown={preventToolbarBlur}
              onClick={() => videoInputRef.current?.click()}
            >
              Video
            </button>

            <div className="mx-1 h-6 w-px bg-black/10 dark:bg-white/15" />

            <select
              aria-label="코드 언어"
              value={codeLanguage}
              className="h-8 rounded-md border border-black/10 bg-transparent px-2 text-sm text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35"
              onChange={(event) =>
                setCodeLanguage(
                  event.target
                    .value as (typeof codeLanguageOptions)[number]["value"],
                )
              }
            >
              {codeLanguageOptions.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="h-8 rounded-md border border-black/10 px-2 text-sm text-black transition-colors duration-300 ease-in-out hover:border-black/25 dark:border-white/15 dark:text-white dark:hover:border-white/35"
              onMouseDown={preventToolbarBlur}
              onClick={insertCodeBlock}
            >
              Code
            </button>
          </>
        ) : null}
      </div>

      {enableEmbeds ? (
        <>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
            className="hidden"
            multiple
            onChange={handleImageChange}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleVideoChange}
          />
          {uploadMessage || isUploading ? (
            <p className="text-sm text-black/45 dark:text-white/45">
              {isUploading ? "파일을 업로드하는 중입니다." : uploadMessage}
            </p>
          ) : null}
        </>
      ) : null}

      <div
        ref={editorRef}
        role="textbox"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        className={`article ${minHeightClassName} rounded-md border border-black/10 bg-transparent px-4 py-3 text-black outline-none transition-colors duration-300 ease-in-out focus:border-black/30 dark:border-white/15 dark:text-white dark:focus:border-white/35`}
        onBlur={saveRange}
        onInput={syncHtml}
        onKeyUp={saveRange}
        onMouseUp={saveRange}
      />
    </div>
  );
});
