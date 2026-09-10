// 路径总和
// https://leetcode.cn/problems/path-sum/
//
// 思路：自顶向下 DFS，沿路把 targetSum 减去当前节点值，走到叶子时判断剩余值是否为 0。
// 复杂度：时间 O(n) 空间 O(h)，h 为树高（递归栈）
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

// 按 LeetCode 层序序列建树，空节点写作 null；序列为空或首元素是 null 时返回空树
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

bool hasPathSum(TreeNode *root, long long remain) {
    if (root == nullptr) return false;
    remain -= root->val;
    if (root->left == nullptr && root->right == nullptr) return remain == 0;
    return hasPathSum(root->left, remain) || hasPathSum(root->right, remain);
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

    TreeNode *root = buildTree(tokens);
    cout << (hasPathSum(root, targetSum) ? "true" : "false") << '\n';
    return 0;
}
