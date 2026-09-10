## 思路

后序 DFS（文档里的 Java 解法）：

```cpp
TreeNode* dfs(TreeNode* root, int p, int q) {
    if (root == nullptr || root->val == p || root->val == q) return root;
    TreeNode* left  = dfs(root->left,  p, q);
    TreeNode* right = dfs(root->right, p, q);
    if (left != nullptr && right != nullptr) return root;  // p、q 一家一个，root 就是答案
    return left != nullptr ? left : right;                 // 只在一侧找到，把结果往上抛
}
```

函数返回值 `dfs(root)` 的语义是：**在以 `root` 为根的子树里，如果能同时找到 p 和 q，就返回它们的最近公共祖先；否则返回在这棵子树里「遇到的那个 p 或 q」**（也可能返回 `nullptr` 表示一个都没遇到）。

正确性来自三种情况的分类讨论（`root` 非空且不是 p、q）：

1. 左右子树各找到一个目标 → p、q 分居两侧，`root` 就是深度最大的公共祖先，直接返回 `root`；
2. 只有一侧找到 → 这一侧的返回值（要么是 LCA，要么是 p/q 本身）继续往上抛；
3. 两侧都没找到 → 返回 `nullptr`。

递归的另一个终止条件是 `root->val == p || root->val == q`：一旦命中目标节点就直接返回它，不需要再往下搜——因为即使另一个目标在它子树里，它自己就是答案（祖先可以是自身）；如果不在，它作为「找到了一个目标」的信号向上汇报。

## 复杂度

- 时间：`O(n)`，每个节点最多访问一次（命中 p/q 后子树会被剪掉，实际更快）
- 空间：`O(h)` 递归栈，`h` 为树高；最坏（链状树）`O(n)`，随机/平衡树 `O(log n)`

## 关键点

- 终止条件里 `root == nullptr` 必须写在最前面，否则访问 `root->val` 会崩
- 判断「左右都非空」才返回 `root`，只找到一侧时要原样返回那一侧，不能返回 `root`
- 节点值互不相同、p、q 一定存在，所以不需要额外处理「找不到」的情况
- 数据范围允许 `10^5` 个节点，链状树时递归深度可能到 `10^5`，如果担心爆栈可以改成显式栈：先用迭代 DFS 记录每个节点的父指针，再让 p、q 轮流向上爬（或记录 p 的祖先集合，从 q 往上找第一个命中的）——不过面试里写出递归版通常就够了

## C++ 实现

见 [`solution.cpp`](./solution.cpp)：先按层序数组（`null` 表示空节点）建树，再用上面的 DFS 输出 LCA 的值。
