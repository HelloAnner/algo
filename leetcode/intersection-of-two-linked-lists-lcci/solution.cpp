// 链表相交
// https://leetcode.cn/problems/intersection-of-two-linked-lists-lcci/
//
// 思路：双指针分别按 A->B、B->A 的顺序走，走过相同的总长度后必在交点相遇；不相交则同时走到 nullptr。
// 复杂度：时间 O(n + m) 空间 O(1)
#include <iostream>
#include <vector>

using namespace std;

struct Node {
    int val = 0;
    Node *next = nullptr;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0, m = 0;
    if (!(cin >> n >> m)) return 0;

    vector<Node> a(n), b(m);
    for (int i = 0; i < n; ++i) {
        cin >> a[i].val;
        if (i > 0) a[i - 1].next = &a[i];
    }
    for (int j = 0; j < m; ++j) {
        cin >> b[j].val;
        if (j > 0) b[j - 1].next = &b[j];
    }

    int skipA = -1, skipB = -1;
    cin >> skipA >> skipB;

    Node *headA = n > 0 ? &a[0] : nullptr;
    Node *headB = m > 0 ? &b[0] : nullptr;

    if (skipA >= 0 && skipB >= 0) {
        // 让 B 的公共部分直接指向 A 的对应节点，两条链表共享同一批节点对象
        Node *meet = &a[skipA];
        if (skipB == 0) {
            headB = meet;
        } else {
            b[skipB - 1].next = meet;
        }
    }

    Node *p = headA;
    Node *q = headB;
    while (p != q) {
        p = p ? p->next : headB;
        q = q ? q->next : headA;
    }

    cout << (p ? p->val : -1) << '\n';
    return 0;
}
