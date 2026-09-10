## 题目描述

用两个栈实现一个队列。队列的声明如下，请实现它的两个函数 `appendTail` 和 `deleteHead`：

- `appendTail(value)`：在队列尾部插入整数 `value`；
- `deleteHead()`：在队列头部删除整数并返回它；若队列中没有元素，返回 `-1`。

（原题是「函数入参」形式，这里改成等价的 ACM 形式：按顺序给出若干次操作，对每次出队输出结果。）

## 输入格式

第一行一个整数 `m`，表示操作的次数（不包含「构造空队列」这一步）。
接下来 `m` 行，每行是一个操作：

- `appendTail x`：把整数 `x` 入队；
- `deleteHead`：出队一次。

## 输出格式

对每一次 `deleteHead` 操作输出一行，表示该次出队返回的值；队列为空时输出 `-1`。

## 示例

### 示例 1

输入：
```
3
appendTail 3
deleteHead
deleteHead
```

输出：
```
3
-1
```

解释：先把 `3` 入队，第一次出队返回 `3`；此时队列已空，第二次出队返回 `-1`。

### 示例 2

输入：
```
5
deleteHead
appendTail 5
appendTail 2
deleteHead
deleteHead
```

输出：
```
-1
5
2
```

解释：空队列出队返回 `-1`；随后依次入队 `5`、`2`，两次出队按先进先出返回 `5`、`2`。

## 数据范围

- `1 <= value <= 10^4`
- `1 <= m <= 10^4`（即最多对 `appendTail` / `deleteHead` 调用 `10^4` 次）
- 保证操作名只会是 `appendTail` 和 `deleteHead`
