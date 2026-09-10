// 二叉树各层节点数（原文档第 52 题，非 LeetCode 原题）
//
// 思路：按层序序列（空节点用 #）建树，再用队列 BFS 逐层统计节点个数。
// 复杂度：时间 O(n) 空间 O(n)
#include <iostream>
#include <queue>
#include <string>
#include <vector>

using namespace std;

struct Node {
    int val;
    int left;   // 左孩子下标，-1 表示空
    int right;  // 右孩子下标，-1 表示空
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    vector<string> tokens;
    string tok;
    while (cin >> tok) tokens.push_back(tok);

    if (tokens.empty() || tokens[0] == "#") {
        cout << 0 << '\n';  // 空树
        return 0;
    }

    // 建树：非空节点依次从序列里领取左右两个孩子（LeetCode 的层序表示）
    vector<Node> tree;
    tree.push_back(Node{stoi(tokens[0]), -1, -1});
    queue<int> pending;  // 还没分配孩子的节点
    pending.push(0);

    size_t idx = 1;
    while (!pending.empty() && idx < tokens.size()) {
        int cur = pending.front();
        pending.pop();
        for (int side = 0; side < 2 && idx < tokens.size(); ++side) {
            if (tokens[idx] != "#") {
                tree.push_back(Node{stoi(tokens[idx]), -1, -1});
                int child = static_cast<int>(tree.size()) - 1;
                if (side == 0) tree[cur].left = child;
                else tree[cur].right = child;
                pending.push(child);
            }
            ++idx;
        }
    }

    // BFS：每轮队列里的元素正好是同一层的全部节点
    vector<int> counts;
    queue<int> bfs;
    bfs.push(0);
    while (!bfs.empty()) {
        size_t levelSize = bfs.size();
        counts.push_back(static_cast<int>(levelSize));
        for (size_t i = 0; i < levelSize; ++i) {
            int cur = bfs.front();
            bfs.pop();
            if (tree[cur].left != -1) bfs.push(tree[cur].left);
            if (tree[cur].right != -1) bfs.push(tree[cur].right);
        }
    }

    for (size_t i = 0; i < counts.size(); ++i) {
        if (i) cout << ' ';
        cout << counts[i];
    }
    cout << '\n';
    return 0;
}
