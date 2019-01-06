module React.Basic.CodeMirror where

import Prelude
import Effect (Effect)
import React.Basic (JSX)

foreign import controlled :: forall a editor.
                                { value            :: String
                                , onBeforeChange   :: String -> Effect Unit
                                , onScroll         :: Int -> editor -> Effect Unit
                                , onEditorDidMount :: editor -> Effect Unit
                                | a }
                                -> JSX

foreign import refresh :: Effect Unit

-- triggers onChange
foreign import replaceSelection :: (String -> String) -- ^ replace function that receives selected text
                                -> Effect Unit
