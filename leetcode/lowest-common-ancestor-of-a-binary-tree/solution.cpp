// 二叉树的最近公共祖先（剑指 Offer 68 - II）
// https://leetcode.cn/problems/lowest-common-ancestor-of-a-binary-tree/
//
// 思路：后序 DFS。命中 p 或 q 就返回该节点，左右子树都返回非空时当前节点即为最近公共祖先。
// 复杂度：时间 O(n) 空间 O(h)（递归栈）
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

TreeNode *lowestCommonAncestor(TreeNode *root, int p, int q) {
    if (root == nullptr || root->val == p || root->val == q) return root;
    TreeNode *left = lowestCommonAncestor(root->left, p, q);
    TreeNode *right = lowestCommonAncestor(root->right, p, q);
    if (left != nullptr && right != nullptr) return root;
    return left != nullptr ? left : right;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    vector<string> tokens(n);
    for (string &s : tokens) cin >> s;
    int p, q;
    cin >> p >> q;

    vector<TreeNode> pool;
    TreeNode *root = buildTree(tokens, pool);
    TreeNode *ans = lowestCommonAncestor(root, p, q);
    cout << ans->val << '\n';
    return 0;
}
