// 二叉树的最小路径和（根 -> 叶子）
// https://leetcode.cn/problems/path-sum/（本题是它的最小和变体；原文档第 28 题没有独立原题链接）
//
// 思路：迭代求出后序序列，再按后序 DP：f(u) = val(u) + 唯一/较小孩子的 f 值，叶子处 f = val。
// 复杂度：时间 O(n) 空间 O(n)
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

using namespace std;

struct Node {
    int val;
    int left;
    int right;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // 读入层序数组表示（null 表示空节点）
    vector<string> tok;
    string s;
    while (cin >> s) tok.push_back(s);

    if (tok.empty() || (tok.size() == 1 && tok[0] == "null")) {
        return 0;  // 空树：题目保证不会出现
    }

    vector<Node> tr;
    tr.push_back(Node{stoi(tok[0]), -1, -1});
    queue<int> q;
    q.push(0);
    size_t i = 1;
    while (!q.empty() && i < tok.size()) {
        int u = q.front();
        q.pop();
        if (i < tok.size()) {
            if (tok[i] != "null") {
                tr.push_back(Node{stoi(tok[i]), -1, -1});
                tr[u].left = static_cast<int>(tr.size()) - 1;
                q.push(tr[u].left);
            }
            ++i;
        }
        if (i < tok.size()) {
            if (tok[i] != "null") {
                tr.push_back(Node{stoi(tok[i]), -1, -1});
                tr[u].right = static_cast<int>(tr.size()) - 1;
                q.push(tr[u].right);
            }
            ++i;
        }
    }

    // 迭代前序的镜像：根 -> 右 -> 左；反转后得到后序：左 -> 右 -> 根
    vector<int> post;
    vector<int> st;
    st.push_back(0);
    while (!st.empty()) {
        int u = st.back();
        st.pop_back();
        post.push_back(u);
        if (tr[u].left != -1) st.push_back(tr[u].left);
        if (tr[u].right != -1) st.push_back(tr[u].right);
    }
    reverse(post.begin(), post.end());

    // 后序 DP：孩子先于父亲算好
    vector<long long> f(tr.size(), 0);
    for (int u : post) {
        int l = tr[u].left;
        int r = tr[u].right;
        long long best;
        if (l == -1 && r == -1) {
            best = 0;  // 叶子：没有后继
        } else if (l == -1) {
            best = f[r];  // 只有右孩子，必须走它
        } else if (r == -1) {
            best = f[l];  // 只有左孩子，必须走它
        } else {
            best = min(f[l], f[r]);
        }
        f[u] = tr[u].val + best;
    }

    cout << f[0] << '\n';
    return 0;
}
