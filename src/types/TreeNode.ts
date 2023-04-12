export class TreeNode<T> {

  public constructor(
    public payload: T,
    public parent: TreeNode<T> = null,
    public children: { [key: string]: TreeNode<T> } = {}
  ) {
  }


}
