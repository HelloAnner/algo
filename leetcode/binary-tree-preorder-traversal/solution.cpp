// 二叉树的前序遍历（144）—— 迭代实现
// https://leetcode.cn/problems/binary-tree-preorder-traversal/
//
// 思路：显式栈模拟递归，出栈即访问，入栈时先压右孩子再压左孩子。
// 复杂度：时间 O(n) 空间 O(h)（栈）
#include <iostream>
#include <queue>
#include <string>
#include <vector>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    explicit TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

// 按层序数组建树（"null" 表示空节点），节点内存由 pool 持有
TreeNode *buildTree(const vector<string> &tokens, vector<TreeNode> &pool) {
    if (tokens.empty() || tokens[0] == "null") return nullptr;
    pool.reserve(tokens.size());
    pool.emplace_back(stoi(tokens[0]));
    TreeNode *root = &pool.back();

    queue<TreeNode *> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode *cur = q.front();
        q.pop();
        if (i < tokens.size()) {
            const string &s = tokens[i++];
            if (s != "null") {
                pool.emplace_back(stoi(s));
                cur->left = &pool.back();
                q.push(cur->left);
            }
        }
        if (i < tokens.size()) {
            const string &s = tokens[i++];
            if (s != "null") {
                pool.emplace_back(stoi(s));
                cur->right = &pool.back();
                q.push(cur->right);
            }
        }
    }
    return root;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<string> tokens(n);
    for (string &s : tokens) cin >> s;

    vector<TreeNode> pool;
    TreeNode *root = buildTree(tokens, pool);

    vector<int> res;
    vector<TreeNode *> stk;
    if (root != nullptr) stk.push_back(root);
    while (!stk.empty()) {
        TreeNode *p = stk.back();
        stk.pop_back();
        res.push_back(p->val);
        if (p->right != nullptr) stk.push_back(p->right);
        if (p->left != nullptr) stk.push_back(p->left);
    }

    for (size_t i = 0; i < res.size(); ++i) {
        if (i > 0) cout << ' ';
        cout << res[i];
    }
    cout << '\n';
    return 0;
}
