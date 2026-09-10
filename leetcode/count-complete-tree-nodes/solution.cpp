// 完全二叉树的节点个数（LeetCode 222. Count Complete Tree Nodes）
// https://leetcode.cn/problems/count-complete-tree-nodes/
//
// 思路：完全二叉树中，若左、右子树的最左深度相同，则左子树是满二叉树，节点数是
//       2^ld（含根），只需再递归右子树；否则右子树是满的，只需再递归左子树。
// 复杂度：时间 O(log^2 n) 空间 O(log n)（递归栈，不含建树的 O(n)）
#include <iostream>
#include <string>
#include <vector>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    explicit TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

static vector<string> tokens;
static size_t pos = 0;

// 按先序序列建树：# 表示空节点
static TreeNode *build() {
    if (pos >= tokens.size()) return nullptr;
    const string &tok = tokens[pos++];
    if (tok == "#") return nullptr;
    TreeNode *node = new TreeNode(stoi(tok));
    node->left = build();
    node->right = build();
    return node;
}

// 沿最左路径走到底的节点数，也就是以 node 为根的满二叉树的高度
static int leftDepth(TreeNode *node) {
    int d = 0;
    while (node != nullptr) {
        ++d;
        node = node->left;
    }
    return d;
}

static int countNodes(TreeNode *root) {
    if (root == nullptr) return 0;
    int ld = leftDepth(root->left);
    int rd = leftDepth(root->right);
    if (ld == rd) {
        // 左子树是满的：2^ld - 1 个节点 + 根节点，再数右子树
        return (1 << ld) + countNodes(root->right);
    }
    // 右子树是满的：2^rd - 1 个节点 + 根节点，再数左子树
    return (1 << rd) + countNodes(root->left);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string tok;
    while (cin >> tok) tokens.push_back(tok);

    TreeNode *root = build();
    cout << countNodes(root) << '\n';

    // 释放整棵树：用显式栈避免递归析构的深度问题
    vector<TreeNode *> stk;
    if (root != nullptr) stk.push_back(root);
    while (!stk.empty()) {
        TreeNode *cur = stk.back();
        stk.pop_back();
        if (cur->left != nullptr) stk.push_back(cur->left);
        if (cur->right != nullptr) stk.push_back(cur->right);
        delete cur;
    }
    return 0;
}
