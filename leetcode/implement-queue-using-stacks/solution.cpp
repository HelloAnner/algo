// 用两个栈实现队列（剑指 Offer 09，等价于 LeetCode 232）
// https://leetcode.cn/problems/yong-liang-ge-zhan-shi-xian-dui-lie-lcof/
//
// 思路：inStack 只负责入队，outStack 只负责出队；outStack 为空时把 inStack 整体倒过去。
// 复杂度：时间 appendTail O(1)、deleteHead 均摊 O(1)，共 O(m)；空间 O(m)
#include <iostream>
#include <string>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m;
    cin >> m;

    vector<int> inStack, outStack;
    string op;
    while (m--) {
        cin >> op;
        if (op == "appendTail") {
            int x;
            cin >> x;
            inStack.push_back(x);  // 入队只压 inStack
        } else {                   // deleteHead
            if (outStack.empty()) {
                // 一次性把 inStack 倒过来，栈顶就成了最早入队的元素
                while (!inStack.empty()) {
                    outStack.push_back(inStack.back());
                    inStack.pop_back();
                }
            }
            if (outStack.empty()) {
                cout << -1 << '\n';  // 队列为空
            } else {
                cout << outStack.back() << '\n';
                outStack.pop_back();
            }
        }
    }
    return 0;
}