// 重建二叉树（前序 + 中序）
// https://leetcode.cn/problems/zhong-jian-er-cha-shu-lcof/ （LeetCode 105 同题）
//
// 思路：前序首元素是根，用哈希表在中序里 O(1) 定位根，递归划分左右子树，最后输出后序。
// 复杂度：时间 O(n) 空间 O(n)
#include <iostream>
#include <unordered_map>
#include <vector>

using namespace std;

struct Node {
    int val;
    int left;   // 左孩子下标，-1 表示空
    int right;  // 右孩子下标，-1 表示空
};

static vector<int> preorderSeq;
static vector<int> inorderSeq;
static unordered_map<int, int> inPos;  // 值 -> 中序下标
static vector<Node> tree;

// 区间都是闭区间，返回新建子树根节点的下标；空区间返回 -1
static int build(int preL, int preR, int inL, int inR) {
    if (preL > preR) return -1;

    int val = preorderSeq[preL];  // 前序第一个就是根
    int idx = static_cast<int>(tree.size());
    tree.push_back({val, -1, -1});

    int pos = inPos[val];              // 根在中序里的位置
    int leftLen = pos - inL;           // 左子树节点个数
    tree[idx].left = build(preL + 1, preL + leftLen, inL, pos - 1);
    tree[idx].right = build(preL + leftLen + 1, preR, pos + 1, inR);
    return idx;
}

static void postOrder(int root, bool &first) {
    if (root == -1) return;
    postOrder(tree[root].left, first);
    postOrder(tree[root].right, first);
    if (!first) cout << ' ';
    cout << tree[root].val;
    first = false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        cout << '\n';
        return 0;
    }

    preorderSeq.resize(n);
    inorderSeq.resize(n);
    for (int i = 0; i < n; ++i) cin >> preorderSeq[i];
    for (int i = 0; i < n; ++i) cin >> inorderSeq[i];

    inPos.reserve(static_cast<size_t>(n) * 2);
    for (int i = 0; i < n; ++i) inPos[inorderSeq[i]] = i;

    tree.reserve(n);
    int root = build(0, n - 1, 0, n - 1);

    bool first = true;
    postOrder(root, first);
    cout << '\n';
    return 0;
}
