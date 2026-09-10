// 二叉树的后序遍历（非递归）
// https://leetcode.cn/problems/binary-tree-postorder-traversal/
//
// 思路：用迭代前序的镜像（根 -> 右 -> 左）收集节点，最后整体反转，即得后序（左 -> 右 -> 根）。
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

    // 读入全部 token（层序数组表示，null 表示空节点）
    vector<string> tok;
    string s;
    while (cin >> s) tok.push_back(s);

    if (tok.empty() || (tok.size() == 1 && tok[0] == "null")) {
        cout << '\n';  // 空树：输出空行
        return 0;
    }

    // 按层序建树：每个非空节点依次消耗「左孩子、右孩子」两个 token
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

    // 迭代前序的镜像：根 -> 右 -> 左
    vector<int> res;
    vector<int> st;
    st.push_back(0);
    while (!st.empty()) {
        int u = st.back();
        st.pop_back();
        res.push_back(tr[u].val);
        if (tr[u].left != -1) st.push_back(tr[u].left);    // 左孩子先入栈，
        if (tr[u].right != -1) st.push_back(tr[u].right);  // 右孩子后入栈 -> 右孩子先出栈
    }

    // 整体反转 -> 左 -> 右 -> 根
    reverse(res.begin(), res.end());

    for (size_t k = 0; k < res.size(); ++k) {
        if (k) cout << ' ';
        cout << res[k];
    }
    cout << '\n';
    return 0;
}
