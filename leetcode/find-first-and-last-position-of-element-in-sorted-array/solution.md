## 思路

数组有序，用**两次二分**分别求左右边界（文档里的 Java 代码是「二分找到任意一个 `target`，再向左右线性扩展」，那种写法最坏是 `O(n)`，不满足题目的 `O(log n)` 要求，所以这里改成标准做法）：

1. **左边界** `lowerBound`：在 `[0, n)` 里找**第一个 `>= target`** 的下标。区间用左闭右开 `[l, r)`，`mid` 的值 `>= target` 就收缩右边界 `r = mid`，否则 `l = mid + 1`；结束时 `l` 就是答案。
2. **右边界** `upperBound`：找**第一个 `> target`** 的下标，只需要把判断从 `nums[mid] >= target` 改成 `nums[mid] > target`，其余完全一样；结束位置就是 `upperBound - 1`。

最后判断：如果 `left == n` 或者 `nums[left] != target`，说明数组里没有 `target`，输出 `-1 -1`；否则输出 `left` 和 `right - 1`。

**为什么对**：`lowerBound` 的不变式是「答案一定在 `[l, r]` 内且 `[0, l)` 里的元素都 `< target`」。每次 `nums[mid] >= target` 时，`mid` 本身也可能是答案，所以保留它（`r = mid`）；`nums[mid] < target` 时 `mid` 及其左边都不可能是答案（`l = mid + 1`）。区间每轮缩小一半，最终 `l == r` 时 `l` 就是第一个 `>= target` 的位置。同理 `upperBound` 得到第一个 `> target` 的位置，减一即为最后一个 `== target` 的位置。

C++ 里也可以直接用 `std::lower_bound` / `std::upper_bound`，语义与上面完全一致（本实现手写二分，方便面试时白板推导）。

## 复杂度

- 时间：O(log n)，两次二分
- 空间：O(1)（不计存放输入的数组）；读入数组本身是 O(n)

## 关键点

- 区间写成**左闭右开** `[l, r)`，循环条件是 `l < r`，`r` 的初值是 `n`——这样不用处理 `r = mid - 1` 之类的边界，也不容易死循环
- `mid = l + (r - l) / 2`，等价于 `(l + r) / 2` 但不容易溢出（本题下标在 `int` 内，两种都安全）
- `nums[mid] >= target` 时是 `r = mid`（不是 `mid - 1`），因为 `mid` 可能就是左边界
- 右边界用「第一个 `> target` 的位置减一」，不要写第三个二分去找「最后一个 `<= target`」，两件事本质相同但容易写错边界
- 找不到时（`left == n` 或 `nums[left] != target`）要输出 `-1 -1`
- 数组全为同一个值、`target` 在数组两端、`n = 1` 都是常见陷阱
- 文档里「先二分定位再向两边扫」的写法虽然能过题，但最坏 O(n)，被问到复杂度时会被追问

## C++ 实现

见 [`solution.cpp`](./solution.cpp)：`lowerBound` + `upperBound` 两次二分。
