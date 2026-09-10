// 二叉排序树中第 k 大的元素（文档 69 节，非 LeetCode 原题）
// （《手撕字节跳动面试时出现过的算法题》69：利用二叉排序树的性质找第 k 大的元素）
//
// 思路：按插入顺序建 BST，再对它做「右-根-左」的逆中序遍历，第 k 个访问到的就是答案（迭代实现，防退化树爆栈）。
// 复杂度：时间 建树最坏 O(n^2) / 遍历 O(n)，空间 O(n)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;

    // 数组存树：下标即节点编号，-1 表示空孩子；0 号节点是根
    vector<int> val(n, 0), leftChild(n, -1), rightChild(n, -1);
    cin >> val[0];
    for (int i = 1; i < n; ++i) {
        cin >> val[i];
        int cur = 0;
        while (true) {  // 从根一路比较，找到空位挂上去
            if (val[i] < val[cur]) {
                if (leftChild[cur] == -1) {
                    leftChild[cur] = i;
                    break;
                }
                cur = leftChild[cur];
            } else {
                if (rightChild[cur] == -1) {
                    rightChild[cur] = i;
                    break;
                }
                cur = rightChild[cur];
            }
        }
    }

    // 逆中序遍历：右 -> 根 -> 左，从最大的元素开始数
    vector<int> stk;
    int cur = 0, cnt = 0, ans = val[0];
    while (cur != -1 || !stk.empty()) {
        while (cur != -1) {  // 一路向右，右子树里的值都更大
            stk.push_back(cur);
            cur = rightChild[cur];
        }
        cur = stk.back();
        stk.pop_back();
        if (++cnt == k) {  // 第 k 个访问到的就是第 k 大
            ans = val[cur];
            break;
        }
        cur = leftChild[cur];
    }

    cout << ans << '\n';
    return 0;
}
