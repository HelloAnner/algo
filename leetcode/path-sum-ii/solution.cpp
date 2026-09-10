// 路径总和 II
// https://leetcode.cn/problems/path-sum-ii/
//
// 思路：DFS + 回溯，维护当前路径 path 和剩余目标和 remain，在叶子且 remain == 0 时记录答案。
// 复杂度：时间 O(n^2)（拷贝路径） 空间 O(h)，h 为树高
#include <iostream>
#include <queue>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    explicit TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

// 按 LeetCode 层序序列建树，空节点写作 null
TreeNode *buildTree(const vector<string> &tokens) {
    if (tokens.empty() || tokens[0] == "null") return nullptr;
    TreeNode *root = new TreeNode(stoi(tokens[0]));
    queue<TreeNode *> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode *cur = q.front();
        q.pop();
        if (tokens[i] != "null") {
            cur->left = new TreeNode(stoi(tokens[i]));
            q.push(cur->left);
        }
        ++i;
        if (i < tokens.size()) {
            if (tokens[i] != "null") {
                cur->right = new TreeNode(stoi(tokens[i]));
                q.push(cur->right);
            }
            ++i;
        }
    }
    return root;
}

void dfs(TreeNode *node, long long remain, vector<int> &path, vector<vector<int>> &res) {
    if (node == nullptr) return;
    remain -= node->val;
    path.push_back(node->val);
    if (node->left == nullptr && node->right == nullptr && remain == 0) {
        res.push_back(path);  // 拷贝一份当前路径
    } else {
        dfs(node->left, remain, path, res);
        dfs(node->right, remain, path, res);
    }
    path.pop_back();  // 回溯
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    if (!getline(cin, line)) return 0;

    vector<string> tokens;
    istringstream iss(line);
    for (string tok; iss >> tok;) tokens.push_back(tok);

    long long targetSum = 0;
    cin >> targetSum;

    vector<vector<int>> res;
    vector<int> path;
    dfs(buildTree(tokens), targetSum, path, res);

    cout << res.size() << '\n';
    for (const auto &p : res) {
        for (size_t i = 0; i < p.size(); ++i) {
            if (i > 0) cout << ' ';
            cout << p[i];
        }
        cout << '\n';
    }
    return 0;
}
