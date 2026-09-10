## 思路

**双栈**：一个栈只负责入队，另一个栈只负责出队。

- `inStack`：`appendTail` 时直接 `push` 进去；
- `outStack`：`deleteHead` 时从它 `pop`。若它是空的，就把 `inStack` 里的元素**整体倒过来**压进 `outStack`，再 `pop`；如果倒完还是空，说明队列为空，返回 `-1`。

**为什么对**：栈是后进先出，把 `inStack` 的元素依次弹出并压入 `outStack`，相当于把这段序列**反转了两次**（一次是出栈，一次是入栈），于是 `outStack` 的栈顶恰好是最早入队的元素，符合队列的先进先出。另外，只有在 `outStack` 为空时才倒栈，`outStack` 里已有的元素顺序不会被破坏。

**为什么均摊 O(1)**：每个元素一生只会进 `inStack` 一次、被搬到 `outStack` 一次、从 `outStack` 弹出一次，所以 `m` 次操作的总代价是 O(m)。单次 `deleteHead` 最坏 O(m)，但均摊到每次是 O(1)。

文档里的 Java 代码把新元素压进 `stackB`、从 `stackA` 取元素，和这里是一个思路。

## 复杂度

- 时间：`appendTail` O(1)；`deleteHead` 均摊 O(1)，`m` 次操作总计 O(m)
- 空间：O(m)，两个栈合起来最多存下所有入队元素

## 关键点

- **只在 `outStack` 为空时才倒栈**，否则会把已经排好的顺序打乱
- 倒栈之后要再判一次空，才能正确处理「队列为空返回 -1」
- C++ 用 `vector` 当栈（`push_back` / `back` / `pop_back`）就够了，不必引入 `std::stack`
- 只有 `deleteHead` 才产生输出，`appendTail` 不输出任何东西
- 读操作名用 `string` 比较即可，注意 `appendTail` 后面还要读一个整数

## C++ 实现

见 [`solution.cpp`](./solution.cpp)：`inStack` 入队、`outStack` 出队，`outStack` 空了才整体搬运。
