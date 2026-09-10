// 二叉树中的最大路径和（124）
// https://leetcode.cn/problems/binary-tree-maximum-path-sum/
//
// 思路：后序 DFS，每个节点尝试作为路径最高点拐弯更新答案，向上只返回一条分支的最大贡献（负贡献取 0）。
// 复杂度：时间 O(n) 空间 O(h)（递归栈）
#include <algorithm>
#include <climits>
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

int best = INT_MIN;

// 返回从 node 向下延伸一条链能得到的最大和；同时用「以 node 拐弯」的路径更新全局答案
int maxGain(TreeNode *node) {
    if (node == nullptr) return 0;
    int left = max(maxGain(node->left), 0);
    int right = max(maxGain(node->right), 0);
    best = max(best, node->val + left + right);
    return node->val + max(left, right);
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
    maxGain(root);
    cout << best << '\n';
    return 0;
}
