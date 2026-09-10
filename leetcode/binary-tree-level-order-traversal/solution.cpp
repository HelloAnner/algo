// 二叉树的层序遍历
// https://leetcode.cn/problems/binary-tree-level-order-traversal/
//
// 思路：按层序数组建树，BFS 时先记下当前队列长度，一次处理完一整层。
// 复杂度：时间 O(N) 空间 O(W)（W 为最大宽度）
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

    while (!q.empty()) {
        size_t size = q.size();  // 当前这一层的节点个数
        for (size_t i = 0; i < size; ++i) {
            Node *cur = q.front();
            q.pop();
            if (i > 0) cout << ' ';
            cout << cur->val;
            if (cur->left) q.push(cur->left);
            if (cur->right) q.push(cur->right);
        }
        cout << '\n';
    }
    return 0;
}
