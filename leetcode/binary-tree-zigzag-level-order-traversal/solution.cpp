// 二叉树的锯齿形层序遍历
// https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/
//
// 思路：BFS 逐层取出节点值，层号为奇数时把该层反转后再输出。
// 复杂度：时间 O(N) 空间 O(W)（W 为最大宽度）
#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>

using namespace std;

struct Node {
    int val = 0;
    Node *left = nullptr;
    Node *right = nullptr;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n)) return 0;

    vector<Node> nodes(n);
    for (int i = 0; i < n; ++i) cin >> nodes[i].val;

    // 层序数组：下标 i 的孩子是 2i+1 / 2i+2，-1 表示空节点
    for (int i = 1; i < n; ++i) {
        if (nodes[i].val == -1) continue;
        int parent = (i - 1) / 2;
        if (i % 2 == 1) {
            nodes[parent].left = &nodes[i];
        } else {
            nodes[parent].right = &nodes[i];
        }
    }

    queue<Node *> q;
    if (n > 0 && nodes[0].val != -1) q.push(&nodes[0]);

    int level = 0;
    while (!q.empty()) {
        size_t size = q.size();
        vector<int> row;
        row.reserve(size);
        for (size_t i = 0; i < size; ++i) {
            Node *cur = q.front();
            q.pop();
            row.push_back(cur->val);
            if (cur->left) q.push(cur->left);   // 入队顺序永远是先左后右
            if (cur->right) q.push(cur->right);
        }
        if (level % 2 == 1) reverse(row.begin(), row.end());

        for (size_t i = 0; i < row.size(); ++i) {
            if (i > 0) cout << ' ';
            cout << row[i];
        }
        cout << '\n';
        ++level;
    }
    return 0;
}
