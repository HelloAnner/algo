// 二叉树的右视图（LeetCode 199）
// https://leetcode.cn/problems/binary-tree-right-side-view/
//
// 思路：按 LeetCode 层序序列建树，再层序遍历，取每一层的最后一个节点。
// 复杂度：时间 O(n) 空间 O(n)
#include <iostream>
#include <queue>
#include <string>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        cout << '\n';  // 空树
        return 0;
    }

    vector<string> tok(n);
    for (auto &s : tok) cin >> s;

    // 建树：下标 0 是根；leftChild / rightChild 为 -1 表示空
    vector<int> val(n, 0), leftChild(n, -1), rightChild(n, -1);
    vector<bool> isNull(n, false);
    for (int i = 0; i < n; ++i) {
        if (tok[i] == "null") {
            isNull[i] = true;
        } else {
            val[i] = stoi(tok[i]);
        }
    }

    queue<int> q;                  // 已建好、还没分配孩子的节点
    if (!isNull[0]) q.push(0);
    int idx = 1;                   // 下一个待分配的孩子 token
    while (!q.empty() && idx < n) {
        int cur = q.front();
        q.pop();
        if (idx < n) {             // 左孩子
            if (!isNull[idx]) {
                leftChild[cur] = idx;
                q.push(idx);
            }
            ++idx;
        }
        if (idx < n) {             // 右孩子
            if (!isNull[idx]) {
                rightChild[cur] = idx;
                q.push(idx);
            }
            ++idx;
        }
    }

    // 层序遍历，每层最后一个节点即右视图看到的节点
    vector<int> ans;
    queue<int> level;
    level.push(0);
    while (!level.empty()) {
        int sz = (int)level.size();
        for (int i = 0; i < sz; ++i) {
            int cur = level.front();
            level.pop();
            if (i == sz - 1) ans.push_back(val[cur]);
            if (leftChild[cur] != -1) level.push(leftChild[cur]);
            if (rightChild[cur] != -1) level.push(rightChild[cur]);
        }
    }

    for (size_t i = 0; i < ans.size(); ++i) {
        if (i) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
