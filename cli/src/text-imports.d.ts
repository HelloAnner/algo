// Bun 的文本导入（import x from "./f.cpp" with { type: "text" }）
// 运行时由 bun 处理，这里只是让 tsc / 编辑器不报 TS2307。

declare module "*.cpp" {
  const text: string;
  export default text;
}
declare module "*.tmpl" {
  const text: string;
  export default text;
}
declare module "*.lua" {
  const text: string;
  export default text;
}
declare module "*.txt" {
  const text: string;
  export default text;
}
declare module "*/gitignore" {
  const text: string;
  export default text;
}
